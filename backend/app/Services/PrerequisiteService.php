<?php

namespace App\Services;

use App\Models\Asignatura;
use Illuminate\Support\Facades\DB;

class PrerequisiteService
{
    /**
     * Vincula un prerrequisito validando que no genere ciclos directos ni indirectos (RF-03).
     *
     * @return array [success => bool, message => string, code => int]
     */
    public function vincularPrerrequisito(int $idAsignatura, int $idRequisito): array
    {
        if ($idAsignatura === $idRequisito) {
            return [
                'success' => false,
                'message' => 'Una asignatura no puede ser prerrequisito de sí misma.',
                'code' => 422,
            ];
        }

        $existe = DB::table('prerrequisito')
            ->where('id_asignatura', $idAsignatura)
            ->where('id_asignatura_requisito', $idRequisito)
            ->exists();

        if ($existe) {
            return [
                'success' => false,
                'message' => 'El prerrequisito ya se encuentra registrado.',
                'code' => 409,
            ];
        }

        if ($this->generariaCiclo($idAsignatura, $idRequisito)) {
            return [
                'success' => false,
                'message' => 'Rechazado por validación de grafo: Esta vinculación generaría una dependencia circular directa o indirecta.',
                'code' => 422,
            ];
        }

        DB::table('prerrequisito')->insert([
            'id_asignatura' => $idAsignatura,
            'id_asignatura_requisito' => $idRequisito,
        ]);

        return [
            'success' => true,
            'message' => 'Prerrequisito vinculado exitosamente.',
            'code' => 201,
        ];
    }

    /**
     * Elimina una relación de prelación existente.
     */
    public function desvincularPrerrequisito(int $idAsignatura, int $idRequisito): bool
    {
        return DB::table('prerrequisito')
            ->where('id_asignatura', $idAsignatura)
            ->where('id_asignatura_requisito', $idRequisito)
            ->delete() > 0;
    }

    /**
     * Algoritmo de Detección de Ciclos en Grafo Dirigido (RF-03).
     * Comprueba si agregar la arista (idAsignatura -> idRequisito) genera un ciclo.
     * Esto ocurre si ya existe un camino navegando desde idRequisito hacia idAsignatura.
     */
    public function generariaCiclo(int $idAsignatura, int $idRequisito): bool
    {
        $visitados = [];
        $cola = [$idRequisito];
        $visitados[$idRequisito] = true;

        while (!empty($cola)) {
            $actual = array_shift($cola);

            if ($actual === $idAsignatura) {
                return true; // Se encontró camino de retorno: ¡Ciclo detectado!
            }

            // Obtener prerrequisitos que 'actual' necesita
            $vecinos = DB::table('prerrequisito')
                ->where('id_asignatura', $actual)
                ->pluck('id_asignatura_requisito')
                ->toArray();

            foreach ($vecinos as $vecino) {
                if (!isset($visitados[$vecino])) {
                    $visitados[$vecino] = true;
                    $cola[] = (int) $vecino;
                }
            }
        }

        return false;
    }

    /**
     * Prepara los nodos y aristas estructurados para React Flow (@xyflow/react) (CU3, RF-04).
     */
    public function obtenerGrafoParaReactFlow(int $idPlanEstudio): array
    {
        $asignaturas = Asignatura::where('id_plan_estudio', $idPlanEstudio)
            ->orderBy('semestre')
            ->orderBy('sigla')
            ->get();

        $ids = $asignaturas->pluck('id')->toArray();

        $prerrequisitos = DB::table('prerrequisito')
            ->whereIn('id_asignatura', $ids)
            ->whereIn('id_asignatura_requisito', $ids)
            ->get();

        // Agrupar asignaturas por semestre para calcular coordenadas en cuadrícula
        $semestres = [];
        foreach ($asignaturas as $asig) {
            $semestres[$asig->semestre][] = $asig;
        }

        $nodes = [];
        $espaciadoX = 260; // Separación por semestre
        $espaciadoY = 120; // Separación vertical de materias

        foreach ($semestres as $sem => $materias) {
            foreach ($materias as $index => $asig) {
                $nodes[] = [
                    'id' => (string) $asig->id,
                    'type' => 'customSubjectNode',
                    'position' => [
                        'x' => ($sem - 1) * $espaciadoX + 50,
                        'y' => $index * $espaciadoY + 50,
                    ],
                    'data' => [
                        'id' => $asig->id,
                        'sigla' => $asig->sigla,
                        'nombre' => $asig->nombre,
                        'semestre' => $asig->semestre,
                        'creditos' => $asig->creditos,
                        'horasTeoricas' => $asig->horas_teoricas,
                        'horasPracticas' => $asig->horas_practicas,
                        'areaFormativa' => $asig->area_formativa,
                    ],
                ];
            }
        }

        $edges = [];
        foreach ($prerrequisitos as $pre) {
            $edges[] = [
                'id' => 'e-' . $pre->id_asignatura_requisito . '-' . $pre->id_asignatura,
                'source' => (string) $pre->id_asignatura_requisito,
                'target' => (string) $pre->id_asignatura,
                'animated' => true,
                'type' => 'smoothstep',
                'style' => [
                    'stroke' => '#3b82f6',
                    'strokeWidth' => 2,
                ],
            ];
        }

        return [
            'nodes' => $nodes,
            'edges' => $edges,
        ];
    }

    /**
     * Obtiene la cadena completa de prerrequisitos hacia atrás y materias dependientes hacia adelante (RF-04).
     */
    public function obtenerCadenaDependencias(int $idAsignatura): array
    {
        $haciaAtras = [];
        $colaAtras = [$idAsignatura];
        $visitadosAtras = [$idAsignatura => true];

        while (!empty($colaAtras)) {
            $actual = array_shift($colaAtras);
            $requisitos = DB::table('prerrequisito')
                ->where('id_asignatura', $actual)
                ->pluck('id_asignatura_requisito')
                ->toArray();

            foreach ($requisitos as $req) {
                if (!isset($visitadosAtras[$req])) {
                    $visitadosAtras[$req] = true;
                    $colaAtras[] = (int) $req;
                    $haciaAtras[] = (int) $req;
                }
            }
        }

        $haciaAdelante = [];
        $colaAdelante = [$idAsignatura];
        $visitadosAdelante = [$idAsignatura => true];

        while (!empty($colaAdelante)) {
            $actual = array_shift($colaAdelante);
            $dependientes = DB::table('prerrequisito')
                ->where('id_asignatura_requisito', $actual)
                ->pluck('id_asignatura')
                ->toArray();

            foreach ($dependientes as $dep) {
                if (!isset($visitadosAdelante[$dep])) {
                    $visitadosAdelante[$dep] = true;
                    $colaAdelante[] = (int) $dep;
                    $haciaAdelante[] = (int) $dep;
                }
            }
        }

        return [
            'prerrequisitosIds' => $haciaAtras,
            'dependientesIds' => $haciaAdelante,
        ];
    }
}

