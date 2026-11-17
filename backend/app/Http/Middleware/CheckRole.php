<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Valida que el usuario autenticado tenga al menos uno de los roles especificados.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  ...$roles
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No autenticado. Inicie sesión para continuar.',
            ], 401);
        }

        $userRole = strtolower(trim((string) $user->rol?->nombre));
        $allowedRoles = array_map(fn($r) => strtolower(trim($r)), $roles);

        if (!in_array($userRole, $allowedRoles, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso denegado. Su rol (' . ($user->rol?->nombre ?? 'Sin Rol') . ') no cuenta con privilegios para realizar esta acción.',
            ], 403);
        }

        return $next($request);
    }
}
