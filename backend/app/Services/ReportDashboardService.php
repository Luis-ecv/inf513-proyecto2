<?php

namespace App\Services;

use App\Models\Asignatura;
use App\Models\Capitulo;
use App\Models\Componente;
use App\Models\DocumentoEvidencia;
use App\Models\EstadoCapitulo;
use App\Models\Observacion;
use App\Models\PlanEstudio;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ReportDashboardService
{
    /**
     * Tablero de control consolidado con métricas de avance y alertas (RF-09, CU7).
     */
    public function obtenerMetricasDashboard(?int $idPlanEstudio = null): array
    {
        $plan = $idPlanEstudio ? PlanEstudio::find($idPlanEstudio) : PlanEstudio::latest()->first();
        if (!$plan) {
            return [
                'totalCapitulos' => 0,
                'porcentajeAvance' => 0,
                'porEstado' => [],
                'alertasObservados' => [],
                'resumenMalla' => ['totalAsignaturas' => 0, 'totalCreditos' => 0],
            ];
        }

        $componentesIds = Componente::where('id_plan_estudio', $plan->id)->pluck('id')->toArray();

        $capitulosQuery = Capitulo::whereIn('id_componente', $componentesIds);
        $totalCapitulos = (clone $capitulosQuery)->count();

        // Conteo por cada estado de la máquina de estados
        $estados = EstadoCapitulo::all();
        $conteoPorEstado = [];
        $aprobadosCount = 0;

        foreach ($estados as $est) {
            $cant = (clone $capitulosQuery)->where('id_estado', $est->id)->count();
            $conteoPorEstado[$est->nombre] = $cant;

            if ($est->id === ChapterStateMachineService::ESTADO_APROBADO) {
                $aprobadosCount = $cant;
            }
        }

        $porcentajeAvance = $totalCapitulos > 0
            ? round(($aprobadosCount / $totalCapitulos) * 100, 2)
            : 0;

        // Capítulos con alerta (Observados)
        $alertasObservados = Capitulo::whereIn('id_componente', $componentesIds)
            ->where('id_estado', ChapterStateMachineService::ESTADO_OBSERVADO)
            ->with(['componente:id,nombre', 'observaciones' => function ($q) {
                $q->where('resuelta', false)->with('observador:id,nombre_completo');
            }, 'redactores:id,nombre_completo'])
            ->get();

        // Métricas de la Malla
        $asignaturas = Asignatura::where('id_plan_estudio', $plan->id);
        $totalAsignaturas = (clone $asignaturas)->count();
        $totalCreditos = (clone $asignaturas)->sum('creditos');

        return [
            'plan' => [
                'id' => $plan->id,
                'codigo' => $plan->codigo,
                'carrera' => $plan->carrera,
                'estado' => $plan->estado,
            ],
            'totalCapitulos' => $totalCapitulos,
            'porcentajeAvance' => $porcentajeAvance,
            'porEstado' => $conteoPorEstado,
            'alertasObservados' => $alertasObservados,
            'resumenMalla' => [
                'totalAsignaturas' => $totalAsignaturas,
                'totalCreditos' => (int) $totalCreditos,
            ],
        ];
    }

    /**
     * Estadísticas de avance por componente temático (CU8).
     */
    public function obtenerEstadisticasPorComponente(int $idPlanEstudio): array
    {
        $componentes = Componente::where('id_plan_estudio', $idPlanEstudio)
            ->with(['capitulos'])
            ->orderBy('numero')
            ->get();

        $stats = [];
        foreach ($componentes as $comp) {
            $total = $comp->capitulos->count();
            $aprobados = $comp->capitulos->where('id_estado', ChapterStateMachineService::ESTADO_APROBADO)->count();
            $observados = $comp->capitulos->where('id_estado', ChapterStateMachineService::ESTADO_OBSERVADO)->count();

            $stats[] = [
                'id' => $comp->id,
                'numero' => $comp->numero,
                'nombre' => $comp->nombre,
                'totalCapitulos' => $total,
                'aprobados' => $aprobados,
                'observados' => $observados,
                'porcentajeCumplimiento' => $total > 0 ? round(($aprobados / $total) * 100, 2) : 0,
            ];
        }

        return $stats;
    }

    /**
     * Métricas de productividad y actividad por usuario redactor/autoridad (CU8).
     */
    public function obtenerProductividadUsuarios(): array
    {
        $usuarios = User::with('rol')->where('activo', true)->get();

        $res = [];
        foreach ($usuarios as $u) {
            $capitulosAsignados = $u->capitulosAsignados()->count();
            $obsEmitidas = Observacion::where('id_usuario_observador', $u->id)->count();
            $obsSubsanadas = Observacion::where('id_usuario_respuesta', $u->id)->where('resuelta', true)->count();

            $res[] = [
                'id' => $u->id,
                'nombre' => $u->nombre_completo,
                'username' => $u->username,
                'rol' => $u->rol?->nombre ?? 'Sin rol',
                'capitulosAsignados' => $capitulosAsignados,
                'observacionesEmitidas' => $obsEmitidas,
                'observacionesSubsanadas' => $obsSubsanadas,
            ];
        }

        return $res;
    }

    /**
     * Recopila la información consolidada para la generación del documento final (RF-15, CU7).
     */
    public function compilarReporteFinal(int $idPlanEstudio): array
    {
        $plan = PlanEstudio::with([
            'asignaturas' => function ($q) {
                $q->with('prerrequisitos:id,sigla,nombre')->orderBy('semestre')->orderBy('sigla');
            },
            'componentes' => function ($q) {
                $q->orderBy('numero')->with([
                    'capitulos' => function ($c) {
                        $c->where('id_estado', ChapterStateMachineService::ESTADO_APROBADO)
                          ->orderBy('numero')
                          ->with(['evidencias', 'redactores:id,nombre_completo']);
                    }
                ]);
            }
        ])->findOrFail($idPlanEstudio);

        $evidenciasVigentes = DocumentoEvidencia::where('vigente', true)->orderBy('fecha_emision', 'desc')->get();

        return [
            'plan' => $plan,
            'totalAsignaturas' => $plan->asignaturas->count(),
            'totalCreditos' => $plan->asignaturas->sum('creditos'),
            'evidenciasVigentes' => $evidenciasVigentes,
            'fechaCompilacion' => now()->toIso8601String(),
        ];
    }
}

