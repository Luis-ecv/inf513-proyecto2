<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChangeChapterStateRequest;
use App\Http\Requests\StoreObservationRequest;
use App\Http\Requests\SubsanarObservationRequest;
use App\Models\Capitulo;
use App\Models\Componente;
use App\Models\EstadoCapitulo;
use App\Models\HistorialModificacion;
use App\Models\Observacion;
use App\Services\ChapterStateMachineService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChapterController extends Controller
{
    public function __construct(
        protected ChapterStateMachineService $stateMachineService
    ) {}

    /**
     * Lista componentes de un plan con sus capítulos (CU4, RF-05).
     */
    public function listarComponentes(int $idPlan): JsonResponse
    {
        $componentes = Componente::where('id_plan_estudio', $idPlan)
            ->with(['capitulos' => function ($q) {
                $q->with([
                    'estado',
                    'redactores:id,nombre_completo,email',
                    'observaciones' => function ($observationQuery) {
                        $observationQuery
                            ->with('observador:id,nombre_completo')
                            ->orderByDesc('created_at');
                    },
                ])->orderBy('numero');
            }])
            ->orderBy('numero')
            ->get();

        return response()->json([
            'success' => true,
            'componentes' => $componentes,
        ]);
    }

    /**
     * Registro de nuevo componente (RF-05).
     */
    public function storeComponente(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'numero' => ['required', 'integer', 'min:1'],
            'nombre' => ['required', 'string', 'max:120'],
            'descripcion' => ['nullable', 'string'],
            'id_plan_estudio' => ['required', 'integer', 'exists:plan_estudio,id'],
        ], [
            'numero.required' => 'El número de componente es obligatorio.',
            'nombre.required' => 'El nombre del componente es obligatorio.',
            'id_plan_estudio.required' => 'Debe asociar el componente a un plan de estudios.',
        ]);

        $comp = Componente::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Componente registrado exitosamente.',
            'componente' => $comp,
        ], 201);
    }

    /**
     * Registro de nuevo capítulo en estado 'Borrador' (RF-05, RF-06).
     */
    public function storeCapitulo(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'numero' => ['required', 'integer', 'min:1'],
            'titulo' => ['required', 'string', 'max:150'],
            'contenido' => ['nullable', 'string'],
            'id_componente' => ['required', 'integer', 'exists:componente,id'],
        ], [
            'numero.required' => 'El número de capítulo es obligatorio.',
            'titulo.required' => 'El título del capítulo es obligatorio.',
            'id_componente.required' => 'Debe asociar el capítulo a un componente.',
        ]);

        $capitulo = Capitulo::create(array_merge($validated, [
            'id_estado' => ChapterStateMachineService::ESTADO_BORRADOR,
        ]));

        return response()->json([
            'success' => true,
            'message' => "Capítulo registrado exitosamente en estado 'Borrador'.",
            'capitulo' => $capitulo->load('estado'),
        ], 201);
    }

    /**
     * Detalle completo de un capítulo con redactores, evidencias, observaciones y auditoría (CU4, CU5).
     */
    public function showCapitulo(int $id): JsonResponse
    {
        $capitulo = Capitulo::with([
            'componente',
            'estado',
            'redactores:id,nombre_completo,email,foto_ruta',
            'observaciones' => function ($q) {
                $q->with(['observador:id,nombre_completo', 'redactorRespuesta:id,nombre_completo'])->orderByDesc('created_at');
            },
            'evidencias',
            'historial' => function ($q) {
                $q->with('usuario:id,nombre_completo')->orderByDesc('fecha_hora');
            },
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'capitulo' => $capitulo,
        ]);
    }

    /**
     * Asignación de delegado redactor a un capítulo (CU4, RF-05).
     */
    public function asignarRedactor(Request $request, int $idCapitulo): JsonResponse
    {
        $request->validate([
            'id_usuario' => ['required', 'integer', 'exists:usuario,id'],
        ]);

        $cap = Capitulo::findOrFail($idCapitulo);
        $cap->redactores()->syncWithoutDetaching([$request->input('id_usuario')]);

        return response()->json([
            'success' => true,
            'message' => 'Redactor asignado exitosamente al capítulo.',
            'redactores' => $cap->redactores()->get(),
        ]);
    }

    /**
     * Transición formal de la Máquina de Estados con validación de auditoría (CU5, RF-06, RF-07, RF-10).
     */
    public function cambiarEstado(ChangeChapterStateRequest $request, int $idCapitulo): JsonResponse
    {
        $nuevoEstadoId = $request->input('id_estado');
        $justificacion = $request->input('justificacion_tecnica');
        $usuario = $request->user();

        $res = $this->stateMachineService->cambiarEstado($idCapitulo, $nuevoEstadoId, $justificacion, $usuario);

        return response()->json([
            'success' => $res['success'],
            'message' => $res['message'],
            'capitulo' => $res['capitulo'],
        ], $res['code']);
    }

    /**
     * Catálogo de estados de capítulos.
     */
    public function listarEstados(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'estados' => EstadoCapitulo::all(),
        ]);
    }

    /**
     * Registro de observación técnica por autoridad (CU5, RF-08).
     */
    public function storeObservacion(StoreObservationRequest $request, int $idCapitulo): JsonResponse
    {
        $comentario = $request->input('comentario');
        $cambiarAObservado = $request->boolean('cambiar_a_observado', true);
        $usuario = $request->user();

        $obs = $this->stateMachineService->registrarObservacion($idCapitulo, $comentario, $usuario, $cambiarAObservado);

        return response()->json([
            'success' => true,
            'message' => 'Observación técnica registrada exitosamente.',
            'observacion' => $obs->load('observador:id,nombre_completo'),
        ], 201);
    }

    /**
     * Subsanación técnica de observación por redactor (CU5, RF-08).
     */
    public function subsanarObservacion(SubsanarObservationRequest $request, int $idObservacion): JsonResponse
    {
        $respuesta = $request->input('respuesta_delegado');
        $usuario = $request->user();

        $exito = $this->stateMachineService->subsanarObservacion($idObservacion, $respuesta, $usuario);

        return response()->json([
            'success' => $exito,
            'message' => $exito ? 'Observación subsanada exitosamente.' : 'No se pudo subsanar la observación.',
        ]);
    }

    /**
     * Pista histórica inmutable de auditoría del capítulo (RF-10).
     */
    public function historialAuditoria(int $idCapitulo): JsonResponse
    {
        $historial = HistorialModificacion::where('id_capitulo', $idCapitulo)
            ->with('usuario:id,nombre_completo,username')
            ->orderByDesc('fecha_hora')
            ->get();

        return response()->json([
            'success' => true,
            'idCapitulo' => $idCapitulo,
            'historial' => $historial,
        ]);
    }
}

