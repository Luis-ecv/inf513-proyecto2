<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEvidenceRequest;
use App\Models\Asignatura;
use App\Models\Capitulo;
use App\Models\DocumentoEvidencia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Services\AuditBitacoraService;

class EvidenceController extends Controller
{
    public function __construct(
        protected AuditBitacoraService $auditService
    ) {}

    /**
     * Búsqueda facetada y listado del catálogo normativo de evidencias (CU6, RF-11, RF-14).
     */
    public function index(Request $request): JsonResponse
    {
        $query = DocumentoEvidencia::with(['documentoPadre:id,codigo_norma,titulo', 'capitulos:id,numero,titulo']);

        // Filtro facetado por código o palabra clave en título
        if ($request->filled('q')) {
            $q = $request->input('q');
            $query->where(function ($w) use ($q) {
                $w->where('codigo_norma', 'ILIKE', "%{$q}%")
                  ->orWhere('titulo', 'ILIKE', "%{$q}%");
            });
        }

        // Filtro por tipo de documento
        if ($request->filled('tipo_documento')) {
            $query->where('tipo_documento', $request->input('tipo_documento'));
        }

        // Filtro por órgano emisor
        if ($request->filled('organo_emisor')) {
            $query->where('organo_emisor', $request->input('organo_emisor'));
        }

        // Filtro por rango de fechas de emisión
        if ($request->filled('fecha_desde')) {
            $query->where('fecha_emision', '>=', $request->input('fecha_desde'));
        }
        if ($request->filled('fecha_hasta')) {
            $query->where('fecha_emision', '<=', $request->input('fecha_hasta'));
        }

        // Filtro por vigencia
        if ($request->has('vigente')) {
            $query->where('vigente', $request->boolean('vigente'));
        }

        $documentos = $query->orderByDesc('fecha_emision')->get();

        // Opciones facetadas para dropdowns en el frontend
        $facetas = [
            'tipos' => DocumentoEvidencia::distinct()->pluck('tipo_documento'),
            'emisores' => DocumentoEvidencia::distinct()->pluck('organo_emisor'),
        ];

        return response()->json([
            'success' => true,
            'total' => $documentos->count(),
            'facetas' => $facetas,
            'documentos' => $documentos,
        ]);
    }

    /**
     * Carga de archivo PDF/imagen y registro de metadatos (RF-11, RF-12).
     */
    public function store(StoreEvidenceRequest $request): JsonResponse
    {
        $this->rechazarInvitado($request);
        $data = $request->validated();

        $rutaArchivo = $request->file('archivo')->store('evidencias', 'public');

        $doc = DocumentoEvidencia::create([
            'codigo_norma' => $data['codigo_norma'],
            'titulo' => $data['titulo'],
            'tipo_documento' => $data['tipo_documento'],
            // Se conserva el campo para compatibilidad con registros anteriores.
            'organo_emisor' => $data['organo_emisor'] ?? '',
            'fecha_emision' => $data['fecha_emision'],
            'archivo_ruta' => $rutaArchivo,
            'vigente' => true,
            'id_documento_padre' => $data['id_documento_padre'] ?? null,
        ]);
        $this->auditService->registrarCambio(
            $request->user(),
            $request,
            "Se agregó el documento de evidencia '{$doc->codigo_norma} - {$doc->titulo}'."
        );

        return response()->json([
            'success' => true,
            'message' => 'Documento de evidencia registrado exitosamente.',
            'documento' => $doc->load('documentoPadre'),
        ], 201);
    }

    /**
     * Vinculación formal de evidencia documental a un capítulo (RF-13).
     */
    public function vincularCapitulo(Request $request): JsonResponse
    {
        $this->rechazarInvitado($request);
        $request->validate([
            'id_capitulo' => ['required', 'integer', 'exists:capitulo,id'],
            'id_documento' => ['required', 'integer', 'exists:documento_evidencia,id'],
        ]);

        $capitulo = Capitulo::findOrFail($request->input('id_capitulo'));
        $capitulo->evidencias()->syncWithoutDetaching([$request->input('id_documento')]);

        return response()->json([
            'success' => true,
            'message' => 'Evidencia vinculada exitosamente al capítulo.',
            'evidencias' => $capitulo->evidencias()->get(),
        ]);
    }

    /**
     * Desvincula una evidencia de un capítulo.
     */
    public function desvincularCapitulo(Request $request): JsonResponse
    {
        $this->rechazarInvitado($request);
        $request->validate([
            'id_capitulo' => ['required', 'integer', 'exists:capitulo,id'],
            'id_documento' => ['required', 'integer', 'exists:documento_evidencia,id'],
        ]);

        $capitulo = Capitulo::findOrFail($request->input('id_capitulo'));
        $capitulo->evidencias()->detach($request->input('id_documento'));

        return response()->json([
            'success' => true,
            'message' => 'Evidencia desvinculada del capítulo.',
        ]);
    }

    public function descargar(Request $request, int $idDocumento)
    {
        $documento = DocumentoEvidencia::findOrFail($idDocumento);
        abort_if($request->user()?->esInvitado(), 403, 'El rol Invitado solo puede visualizar el catálogo.');

        abort_unless(Storage::disk('public')->exists($documento->archivo_ruta), 404, 'El archivo no está disponible.');

        return Storage::disk('public')->download($documento->archivo_ruta, $documento->codigo_norma . '-' . $documento->titulo);
    }

    public function destroy(Request $request, int $idDocumento): JsonResponse
    {
        $this->rechazarInvitado($request);
        $documento = DocumentoEvidencia::findOrFail($idDocumento);
        $detalle = "Se eliminó el documento de evidencia '{$documento->codigo_norma} - {$documento->titulo}'.";
        $documento->capitulos()->detach();
        $documento->asignaturas()->detach();
        Storage::disk('public')->delete($documento->archivo_ruta);
        $documento->delete();
        $this->auditService->registrarCambio($request->user(), $request, $detalle);

        return response()->json(['success' => true, 'message' => 'Documento eliminado exitosamente.']);
    }

    private function rechazarInvitado(Request $request): void
    {
        abort_if($request->user()?->esInvitado(), 403, 'El rol Invitado solo tiene permisos de visualización.');
    }
}

