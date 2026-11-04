<?php

namespace App\Http\Middleware;

use App\Services\AuditBitacoraService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuditLogMiddleware
{
    public function __construct(
        protected AuditBitacoraService $auditService
    ) {}

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Registrar acceso a recursos de la API (excluyendo logins directos para evitar duplicación)
        try {
            $path = $request->path();
            if ($request->is('api/*') && !str_contains($path, 'auth/login')) {
                $this->auditService->registrarAccesoRecurso($request->user(), $request);
            }
        } catch (\Throwable $e) {
            // Silenciar fallos de auditoría para no interrumpir el flujo principal
            report($e);
        }

        return $response;
    }
}

