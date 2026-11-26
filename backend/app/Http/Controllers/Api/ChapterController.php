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
use App\Models\VersionCapitulo;
use App\Services\ChapterStateMachineService;
use App\Services\AuditBitacoraService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ChapterController extends Controller
{
    public function __construct(
        protected ChapterStateMachineService $stateMachineService,
        protected AuditBitacoraService $auditService
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
        $this->rechazarInvitado($request);
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
        $this->auditService->registrarCambio(
            $request->user(),
            $request,
            "Se agregó el componente #{$comp->numero}: {$comp->nombre}."
        );

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
        $this->rechazarInvitado($request);
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
        $this->auditService->registrarCambio(
            $request->user(),
            $request,
            "Se agregó el capítulo #{$capitulo->numero}: {$capitulo->titulo}."
        );

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
        $this->rechazarInvitado($request);
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
        $this->rechazarInvitado($request);
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
        $this->rechazarInvitado($request);
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
        $this->rechazarInvitado($request);
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

    public function destroyComponente(Request $request, int $idComponente): JsonResponse
    {
        $this->rechazarInvitado($request);
        $componente = Componente::findOrFail($idComponente);
        $detalle = "Se eliminó el componente #{$componente->numero}: {$componente->nombre}.";
        $componente->delete();
        $this->auditService->registrarCambio($request->user(), $request, $detalle);

        return response()->json(['success' => true, 'message' => 'Componente eliminado exitosamente.']);
    }

    public function destroyCapitulo(Request $request, int $idCapitulo): JsonResponse
    {
        $this->rechazarInvitado($request);
        $capitulo = Capitulo::findOrFail($idCapitulo);
        $detalle = "Se eliminó el capítulo #{$capitulo->numero}: {$capitulo->titulo}.";
        $capitulo->delete();
        $this->auditService->registrarCambio($request->user(), $request, $detalle);

        return response()->json(['success' => true, 'message' => 'Capítulo eliminado exitosamente.']);
    }

    /**
     * Listado cronológico de versiones de documentos de un capítulo (CU4, CU5).
     */
    public function listarVersiones(int $idCapitulo): JsonResponse
    {
        $capitulo = Capitulo::findOrFail($idCapitulo);
        $versiones = VersionCapitulo::with('usuario:id,nombre_completo,username')
            ->where('id_capitulo', $idCapitulo)
            ->orderBy('numero_version', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'capitulo' => [
                'id' => $capitulo->id,
                'numero' => $capitulo->numero,
                'titulo' => $capitulo->titulo,
                'contenidoActual' => $capitulo->contenido,
            ],
            'versiones' => $versiones,
        ]);
    }

    /**
     * Publicación de una nueva versión del documento del capítulo (subsanación o entrega).
     */
    public function storeVersion(Request $request, int $idCapitulo): JsonResponse
    {
        $this->rechazarInvitado($request);
        $capitulo = Capitulo::findOrFail($idCapitulo);

        $request->validate([
            'archivo' => ['required', 'file', 'mimes:pdf,txt,md', 'max:15360'],
            'contenido_texto' => ['required', 'string'],
            'resumen_cambio' => ['nullable', 'string', 'max:500'],
        ], [
            'archivo.required' => 'Debe adjuntar el archivo digital (PDF o Markdown).',
            'archivo.mimes' => 'El formato del archivo debe ser PDF, Markdown (.md) o Texto (.txt).',
            'archivo.max' => 'El archivo no puede exceder los 15 MB.',
            'contenido_texto.required' => 'No se pudo obtener el contenido de texto del documento para el comparador.',
        ]);

        $file = $request->file('archivo');
        $nombreOriginal = $file->getClientOriginalName();
        $rutaArchivo = $file->store('capitulos_versiones', 'public');

        $ultimaVersion = VersionCapitulo::where('id_capitulo', $idCapitulo)->max('numero_version') ?? 0;
        $nuevaVersion = $ultimaVersion + 1;

        $version = VersionCapitulo::create([
            'id_capitulo' => $idCapitulo,
            'numero_version' => $nuevaVersion,
            'nombre_archivo' => $nombreOriginal,
            'archivo_ruta' => $rutaArchivo,
            'contenido_texto' => $request->input('contenido_texto'),
            'resumen_cambio' => $request->input('resumen_cambio') ?: "Entrega de Versión #{$nuevaVersion}",
            'id_usuario' => $request->user()->id,
        ]);

        // Sincronizar el contenido redactado del capítulo con la última versión
        $capitulo->contenido = $request->input('contenido_texto');
        $capitulo->save();

        // Auditoría inmutable
        $this->auditService->registrarEntregaVersion(
            $request->user(),
            $idCapitulo,
            $nuevaVersion,
            $nombreOriginal,
            $request
        );

        return response()->json([
            'success' => true,
            'message' => "Versión #{$nuevaVersion} publicada exitosamente para el Capítulo #{$capitulo->numero}.",
            'version' => $version->load('usuario:id,nombre_completo,username'),
            'capitulo' => $capitulo,
        ], 201);
    }

    /**
     * Descarga segura del archivo digital original de una versión de capítulo (PDF, MD o TXT).
     */
    public function descargarVersion(Request $request, int $idVersion)
    {
        $version = VersionCapitulo::findOrFail($idVersion);

        abort_if($request->user()?->esInvitado(), 403, 'El rol Invitado solo tiene permisos de visualización.');

        abort_unless(
            Storage::disk('public')->exists($version->archivo_ruta),
            404,
            'El documento de la versión no se encuentra disponible en el almacenamiento.'
        );

        return Storage::disk('public')->download($version->archivo_ruta, $version->nombre_archivo);
    }

    private function rechazarInvitado(Request $request): void
    {
        abort_if($request->user()?->esInvitado(), 403, 'El rol Invitado solo tiene permisos de visualización.');
    }
}

