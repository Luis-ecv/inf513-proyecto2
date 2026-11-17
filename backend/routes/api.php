<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChapterController;
use App\Http\Controllers\Api\CurriculumController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EvidenceController;
use App\Http\Controllers\Api\SiteController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Rutas Públicas de la API
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

Route::prefix('site')->group(function () {
    Route::post('/visita', [SiteController::class, 'registrarVisita']); // Req. 7: Contador de visitas por página
    Route::get('/busqueda', [SiteController::class, 'busquedaGlobal']); // Req. 9: Búsqueda del negocio en encabezado
});

/*
|--------------------------------------------------------------------------
| Rutas Protegidas mediante Laravel Sanctum
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // Autenticación, sesión y menú dinámico (CU1, Req. 2, Req. 4)
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::get('/menu', [AuthController::class, 'menu']);
        Route::post('/perfil', [AuthController::class, 'actualizarPerfil']);
        Route::post('/cambiar-password-obligatorio', [AuthController::class, 'cambiarPasswordObligatorio']);
    });

    // Gestión de Usuarios y Roles (CU1, Req. 4: Solo rol Director)
    Route::middleware('role:Director')->group(function () {
        Route::get('/roles', [AuthController::class, 'roles']);
        Route::get('/usuarios', [AuthController::class, 'listarUsuarios']);
        Route::post('/usuarios', [AuthController::class, 'storeUsuario']);
        Route::post('/usuarios/{id}/reset-password', [AuthController::class, 'resetPasswordUsuario']);
        Route::get('/bitacora', [DashboardController::class, 'bitacora']);
        Route::get('/bitacora/exportar', [DashboardController::class, 'exportarBitacora']);
    });

    // Módulo 1: Malla Curricular y Grafo de Prerrequisitos (CU2, CU3, RF-01 a RF-04)
    Route::get('/planes', [CurriculumController::class, 'listarPlanes']);
    Route::post('/planes', [CurriculumController::class, 'storePlan']);
    Route::get('/planes/{idPlan}/asignaturas', [CurriculumController::class, 'listarAsignaturas']);
    Route::post('/asignaturas', [CurriculumController::class, 'storeAsignatura']);
    Route::put('/asignaturas/{idAsignatura}', [CurriculumController::class, 'updateAsignatura']);
    Route::delete('/asignaturas/{idAsignatura}', [CurriculumController::class, 'destroyAsignatura']);
    Route::get('/planes/{idPlan}/grafo', [CurriculumController::class, 'grafoPrerrequisitos']);
    Route::post('/prerrequisitos', [CurriculumController::class, 'vincularPrerrequisito']);
    Route::delete('/prerrequisitos', [CurriculumController::class, 'desvincularPrerrequisito']);
    Route::get('/asignaturas/{idAsignatura}/dependencias', [CurriculumController::class, 'cadenaDependencias']);

    // Módulo 2: Avance del Rediseño, Máquina de Estados y Auditoría (CU4, CU5, RF-05 a RF-10)
    Route::get('/planes/{idPlan}/componentes', [ChapterController::class, 'listarComponentes']);
    Route::post('/componentes', [ChapterController::class, 'storeComponente']);
    Route::post('/capitulos', [ChapterController::class, 'storeCapitulo']);
    Route::delete('/componentes/{idComponente}', [ChapterController::class, 'destroyComponente']);
    Route::delete('/capitulos/{idCapitulo}', [ChapterController::class, 'destroyCapitulo']);
    Route::get('/capitulos/{id}', [ChapterController::class, 'showCapitulo']);
    Route::post('/capitulos/{id}/redactores', [ChapterController::class, 'asignarRedactor']);
    Route::put('/capitulos/{id}/estado', [ChapterController::class, 'cambiarEstado']);
    Route::get('/estados-capitulo', [ChapterController::class, 'listarEstados']);
    Route::post('/capitulos/{id}/observaciones', [ChapterController::class, 'storeObservacion']);
    Route::put('/observaciones/{id}/subsanar', [ChapterController::class, 'subsanarObservacion']);
    Route::get('/capitulos/{id}/historial', [ChapterController::class, 'historialAuditoria']);
    Route::get('/capitulos/{id}/versiones', [ChapterController::class, 'listarVersiones']);
    Route::post('/capitulos/{id}/versiones', [ChapterController::class, 'storeVersion']);

    // Módulo 3: Repositorio Digital y Búsqueda Facetada (CU6, RF-11 a RF-14)
    Route::get('/evidencias', [EvidenceController::class, 'index']);
    Route::post('/evidencias', [EvidenceController::class, 'store']);
    Route::get('/evidencias/{idDocumento}/descargar', [EvidenceController::class, 'descargar']);
    Route::delete('/evidencias/{idDocumento}', [EvidenceController::class, 'destroy']);
    Route::post('/evidencias/vincular-capitulo', [EvidenceController::class, 'vincularCapitulo']);
    Route::post('/evidencias/desvincular-capitulo', [EvidenceController::class, 'desvincularCapitulo']);

    // Tablero de Control, Estadísticas y Compilador Oficial (CU7, CU8, RF-09, RF-15, Req. 8)
    Route::get('/dashboard/metricas', [DashboardController::class, 'metricas']);
    Route::get('/dashboard/planes/{idPlan}/componentes', [DashboardController::class, 'componentesStats']);
    Route::get('/dashboard/productividad', [DashboardController::class, 'productividadUsuarios']);
    Route::get('/dashboard/planes/{idPlan}/reporte-final', [DashboardController::class, 'reporteFinal']);
});
