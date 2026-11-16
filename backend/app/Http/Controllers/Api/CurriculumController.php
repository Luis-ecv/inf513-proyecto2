<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePrerequisiteRequest;
use App\Http\Requests\StoreSubjectRequest;
use App\Http\Requests\UpdateSubjectRequest;
use App\Models\Asignatura;
use App\Models\PlanEstudio;
use App\Services\PrerequisiteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CurriculumController extends Controller
{
    public function __construct(
        protected PrerequisiteService $prerequisiteService
    ) {}

    /**
     * Lista de planes de estudio (CU2, RF-01).
     */
    public function listarPlanes(): JsonResponse
    {
        $planes = PlanEstudio::withCount('asignaturas')->orderByDesc('anio_vigencia')->get();

        return response()->json([
            'success' => true,
            'planes' => $planes,
        ]);
    }

    /**
     * Registro de nuevo plan de estudio (RF-01).
     */
    public function storePlan(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'codigo' => ['required', 'string', 'max:30', 'unique:plan_estudio,codigo'],
            'carrera' => ['required', 'string', 'max:120'],
            'anio_vigencia' => ['required', 'integer', 'min:1990'],
            'descripcion' => ['nullable', 'string'],
            'objetivos' => ['required', 'string'],
            'perfil_egreso' => ['required', 'string'],
            'limite_creditos_min' => ['required', 'integer', 'min:150'],
            'limite_creditos_max' => ['required', 'integer', 'gte:limite_creditos_min'],
        ], [
            'codigo.required' => 'El código del plan es obligatorio.',
            'codigo.unique' => 'Este código de plan ya existe.',
            'carrera.required' => 'El nombre de la carrera es obligatorio.',
            'anio_vigencia.required' => 'El año de vigencia es obligatorio.',
            'objetivos.required' => 'Los objetivos del plan son obligatorios.',
            'perfil_egreso.required' => 'El perfil de egreso es obligatorio.',
            'limite_creditos_min.required' => 'El límite mínimo de créditos es obligatorio.',
            'limite_creditos_max.gte' => 'El límite máximo de créditos debe ser mayor o igual al mínimo.',
        ]);

        $plan = PlanEstudio::create(array_merge($validated, ['estado' => 'En Elaboración']));

        return response()->json([
            'success' => true,
            'message' => 'Plan de estudio registrado exitosamente.',
            'plan' => $plan,
        ], 201);
    }

    /**
     * Lista asignaturas de un plan de estudios agrupadas por semestre (CU2, RF-02).
     */
    public function listarAsignaturas(int $idPlan): JsonResponse
    {
        $plan = PlanEstudio::findOrFail($idPlan);
        $asignaturas = Asignatura::where('id_plan_estudio', $idPlan)
            ->with(['prerrequisitos:id,sigla,nombre,semestre', 'materiasDependientes:id,sigla,nombre,semestre'])
            ->orderBy('semestre')
            ->orderBy('sigla')
            ->get();

        return response()->json([
            'success' => true,
            'plan' => $plan,
            'asignaturas' => $asignaturas,
            'totalCreditos' => $asignaturas->sum('creditos'),
        ]);
    }

    /**
     * Registro de una nueva asignatura (RF-02).
     */
    public function storeAsignatura(StoreSubjectRequest $request): JsonResponse
    {
        $asignatura = Asignatura::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Asignatura registrada exitosamente.',
            'asignatura' => $asignatura,
        ], 201);
    }

    /**
     * Actualiza una asignatura existente (RF-02).
     */
    public function updateAsignatura(UpdateSubjectRequest $request, int $idAsignatura): JsonResponse
    {
        $asignatura = Asignatura::findOrFail($idAsignatura);
        $asignatura->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Asignatura actualizada exitosamente.',
            'asignatura' => $asignatura->fresh(),
        ]);
    }

    /**
     * Elimina una asignatura sin relaciones de prelación pendientes.
     */
    public function destroyAsignatura(int $idAsignatura): JsonResponse
    {
        $asignatura = Asignatura::findOrFail($idAsignatura);
        $prerrequisitos = $asignatura->materiasDependientes()->count() + $asignatura->prerrequisitos()->count();

        if ($prerrequisitos > 0) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar la asignatura porque todavía tiene relaciones de prelación. Desvincúlelas primero desde el grafo.',
            ], 409);
        }

        $asignatura->delete();

        return response()->json([
            'success' => true,
            'message' => 'Asignatura eliminada exitosamente.',
        ]);
    }

    /**
     * Estructura de nodos y aristas lista para visualización gráfica en React Flow (CU3, RF-04).
     */
    public function grafoPrerrequisitos(int $idPlan): JsonResponse
    {
        $grafo = $this->prerequisiteService->obtenerGrafoParaReactFlow($idPlan);

        return response()->json([
            'success' => true,
            'idPlan' => $idPlan,
            'grafo' => $grafo,
        ]);
    }

    /**
     * Vinculación de prelación con validación de ciclo DAG (CU3, RF-03).
     */
    public function vincularPrerrequisito(StorePrerequisiteRequest $request): JsonResponse
    {
        $idAsig = $request->input('id_asignatura');
        $idReq = $request->input('id_asignatura_requisito');

        $res = $this->prerequisiteService->vincularPrerrequisito($idAsig, $idReq);

        return response()->json([
            'success' => $res['success'],
            'message' => $res['message'],
        ], $res['code']);
    }

    /**
     * Eliminación de prerrequisito.
     */
    public function desvincularPrerrequisito(Request $request): JsonResponse
    {
        $request->validate([
            'id_asignatura' => ['required', 'integer'],
            'id_asignatura_requisito' => ['required', 'integer'],
        ]);

        $eliminado = $this->prerequisiteService->desvincularPrerrequisito(
            $request->input('id_asignatura'),
            $request->input('id_asignatura_requisito')
        );

        return response()->json([
            'success' => $eliminado,
            'message' => $eliminado ? 'Prerrequisito desvinculado exitosamente.' : 'No se encontró la vinculación especificada.',
        ]);
    }

    /**
     * Obtiene la cadena completa de prerrequisitos anteriores y materias dependientes posteriores (RF-04).
     */
    public function cadenaDependencias(int $idAsignatura): JsonResponse
    {
        $cadena = $this->prerequisiteService->obtenerCadenaDependencias($idAsignatura);

        return response()->json([
            'success' => true,
            'idAsignatura' => $idAsignatura,
            'cadena' => $cadena,
        ]);
    }
}

