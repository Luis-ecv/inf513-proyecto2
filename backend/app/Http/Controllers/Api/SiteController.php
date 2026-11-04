<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asignatura;
use App\Models\Capitulo;
use App\Models\ContadorVisitas;
use App\Models\DocumentoEvidencia;
use App\Models\PlanEstudio;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SiteController extends Controller
{
    /**
     * Incrementa y retorna el contador de visitas de una página para el pie de página (Requisito 7).
     */
    public function registrarVisita(Request $request): JsonResponse
    {
        $request->validate([
            'ruta_pagina' => ['required', 'string', 'max:150'],
        ]);

        $ruta = '/' . ltrim($request->input('ruta_pagina'), '/');
        $visitas = ContadorVisitas::incrementarVisita($ruta);

        return response()->json([
            'success' => true,
            'ruta' => $ruta,
            'visitas' => $visitas,
        ]);
    }

    /**
     * Búsqueda global de información del negocio para el encabezado (Requisito 9).
     * Busca transversalmente en Asignaturas, Capítulos, Documentos de Evidencia y Planes de Estudio.
     */
    public function busquedaGlobal(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));
        if (mb_strlen($q) < 2) {
            return response()->json([
                'success' => true,
                'consulta' => $q,
                'resultados' => [
                    'asignaturas' => [],
                    'capitulos' => [],
                    'evidencias' => [],
                    'planes' => [],
                ],
            ]);
        }

        // 1. Asignaturas por sigla o nombre
        $asignaturas = Asignatura::where('sigla', 'ILIKE', "%{$q}%")
            ->orWhere('nombre', 'ILIKE', "%{$q}%")
            ->orWhere('area_formativa', 'ILIKE', "%{$q}%")
            ->select('id', 'sigla', 'nombre', 'semestre', 'creditos', 'area_formativa')
            ->limit(5)
            ->get();

        // 2. Capítulos por título o contenido
        $capitulos = Capitulo::where('titulo', 'ILIKE', "%{$q}%")
            ->orWhere('contenido', 'ILIKE', "%{$q}%")
            ->with(['componente:id,nombre', 'estado:id,nombre'])
            ->select('id', 'numero', 'titulo', 'id_componente', 'id_estado')
            ->limit(5)
            ->get();

        // 3. Documentos y Resoluciones por código o título
        $evidencias = DocumentoEvidencia::where('codigo_norma', 'ILIKE', "%{$q}%")
            ->orWhere('titulo', 'ILIKE', "%{$q}%")
            ->orWhere('organo_emisor', 'ILIKE', "%{$q}%")
            ->select('id', 'codigo_norma', 'titulo', 'tipo_documento', 'organo_emisor', 'archivo_ruta')
            ->limit(5)
            ->get();

        // 4. Planes de estudio
        $planes = PlanEstudio::where('codigo', 'ILIKE', "%{$q}%")
            ->orWhere('carrera', 'ILIKE', "%{$q}%")
            ->select('id', 'codigo', 'carrera', 'anio_vigencia', 'estado')
            ->limit(3)
            ->get();

        return response()->json([
            'success' => true,
            'consulta' => $q,
            'resultados' => [
                'asignaturas' => $asignaturas,
                'capitulos' => $capitulos,
                'evidencias' => $evidencias,
                'planes' => $planes,
            ],
            'totalCoincidencias' => $asignaturas->count() + $capitulos->count() + $evidencias->count() + $planes->count(),
        ]);
    }
}

