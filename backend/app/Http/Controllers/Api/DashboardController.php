<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BitacoraAcceso;
use App\Services\AuditBitacoraService;
use App\Services\ReportDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DashboardController extends Controller
{
    public function __construct(
        protected ReportDashboardService $reportService,
        protected AuditBitacoraService $auditService
    ) {}

    /**
     * Métricas del Tablero de Control (CU7, RF-09).
     */
    public function metricas(Request $request): JsonResponse
    {
        $idPlan = $request->query('id_plan') ? (int) $request->query('id_plan') : null;
        $data = $this->reportService->obtenerMetricasDashboard($idPlan);

        return response()->json([
            'success' => true,
            'metricas' => $data,
        ]);
    }

    /**
     * Estadísticas de avance por componente curricular (CU8).
     */
    public function componentesStats(int $idPlan): JsonResponse
    {
        $stats = $this->reportService->obtenerEstadisticasPorComponente($idPlan);

        return response()->json([
            'success' => true,
            'idPlan' => $idPlan,
            'componentes' => $stats,
        ]);
    }

    /**
     * Estadísticas de productividad por usuario/redactor (CU8).
     */
    public function productividadUsuarios(): JsonResponse
    {
        $usuarios = $this->reportService->obtenerProductividadUsuarios();

        return response()->json([
            'success' => true,
            'productividad' => $usuarios,
        ]);
    }

    /**
     * Compilador de datos para el reporte oficial estructurado (RF-15, CU7).
     */
    public function reporteFinal(int $idPlan): JsonResponse
    {
        $data = $this->reportService->compilarReporteFinal($idPlan);

        return response()->json([
            'success' => true,
            'reporte' => $data,
        ]);
    }

    /**
     * Reporte de Bitácora de accesos, logins y recursos más accedidos (Requisito 4 y 8).
     */
    public function bitacora(Request $request): JsonResponse
    {
        $query = BitacoraAcceso::with('usuario:id,nombre_completo,username,email')->orderByDesc('fecha_hora');

        if ($request->filled('tipo_evento')) {
            $query->where('tipo_evento', $request->input('tipo_evento'));
        }
        $this->aplicarFiltrosFecha($query, $request);

        $accesos = $query->paginate(25);
        $recursosMasAccedidos = $this->auditService->obtenerRecursosMasAccedidos(10);
        $estadisticasLogins = $this->auditService->obtenerEstadisticasLogins();

        return response()->json([
            'success' => true,
            'bitacora' => $accesos,
            'recursosMasAccedidos' => $recursosMasAccedidos,
            'estadisticasLogins' => $estadisticasLogins,
        ]);
    }

    public function exportarBitacora(Request $request): StreamedResponse
    {
        $request->validate([
            'tipo_evento' => ['nullable', 'string'],
            'fecha_desde' => ['nullable', 'date'],
            'fecha_hasta' => ['nullable', 'date', 'after_or_equal:fecha_desde'],
        ]);

        $query = BitacoraAcceso::with('usuario:id,nombre_completo,username')->orderBy('fecha_hora');
        if ($request->filled('tipo_evento')) {
            $query->where('tipo_evento', $request->input('tipo_evento'));
        }
        $this->aplicarFiltrosFecha($query, $request);

        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Fecha y hora', 'Usuario', 'IP', 'Método', 'Recurso', 'Detalle']);
            foreach ($query->cursor() as $entrada) {
                fputcsv($handle, [
                    $entrada->fecha_hora,
                    $entrada->usuario?->username ?? 'Anónimo',
                    $entrada->ip_address,
                    $entrada->metodo_http,
                    $entrada->recurso_accedido,
                    $entrada->detalle,
                ]);
            }
            fclose($handle);
        }, 'bitacora-auditoria.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function aplicarFiltrosFecha($query, Request $request): void
    {
        if ($request->filled('fecha_desde')) {
            $query->whereDate('fecha_hora', '>=', $request->input('fecha_desde'));
        }
        if ($request->filled('fecha_hasta')) {
            $query->whereDate('fecha_hora', '<=', $request->input('fecha_hasta'));
        }
    }
}

