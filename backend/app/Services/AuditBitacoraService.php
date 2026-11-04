<?php

namespace App\Services;

use App\Models\BitacoraAcceso;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuditBitacoraService
{
    public const EVENTO_LOGIN_EXITOSO = 'login_exitoso';
    public const EVENTO_LOGIN_FALLIDO = 'login_fallido';
    public const EVENTO_RECURSO_ACCEDIDO = 'recurso_accedido';

    /**
     * Registra un inicio de sesión exitoso.
     */
    public function registrarLoginExitoso(User $usuario, Request $request): void
    {
        BitacoraAcceso::create([
            'id_usuario' => $usuario->id,
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 500),
            'tipo_evento' => self::EVENTO_LOGIN_EXITOSO,
            'recurso_accedido' => '/api/auth/login',
            'metodo_http' => 'POST',
            'detalle' => "Inicio de sesión concedido para el usuario '{$usuario->username}' ({$usuario->email}) con rol {$usuario->rol?->nombre}.",
            'fecha_hora' => now(),
        ]);
    }

    /**
     * Registra un intento fallido de autenticación.
     */
    public function registrarLoginFallido(string $emailIntentado, Request $request, string $motivo): void
    {
        BitacoraAcceso::create([
            'id_usuario' => null,
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 500),
            'tipo_evento' => self::EVENTO_LOGIN_FALLIDO,
            'recurso_accedido' => '/api/auth/login',
            'metodo_http' => 'POST',
            'detalle' => "Intento denegado para credencial '{$emailIntentado}'. Motivo: {$motivo}",
            'fecha_hora' => now(),
        ]);
    }

    /**
     * Registra el acceso a un recurso de la API.
     */
    public function registrarAccesoRecurso(?User $usuario, Request $request): void
    {
        BitacoraAcceso::create([
            'id_usuario' => $usuario?->id,
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 500),
            'tipo_evento' => self::EVENTO_RECURSO_ACCEDIDO,
            'recurso_accedido' => '/' . ltrim($request->path(), '/'),
            'metodo_http' => $request->method(),
            'detalle' => null,
            'fecha_hora' => now(),
        ]);
    }

    /**
     * Retorna los recursos/endpoints más accedidos (Requisito 4).
     */
    public function obtenerRecursosMasAccedidos(int $limite = 10): array
    {
        return BitacoraAcceso::select('recurso_accedido', 'metodo_http', DB::raw('COUNT(*) as total_accesos'))
            ->where('tipo_evento', self::EVENTO_RECURSO_ACCEDIDO)
            ->groupBy('recurso_accedido', 'metodo_http')
            ->orderByDesc('total_accesos')
            ->limit($limite)
            ->get()
            ->toArray();
    }

    /**
     * Retorna estadísticas consolidadas de logins exitosos y fallidos (Requisito 4 y 8).
     */
    public function obtenerEstadisticasLogins(): array
    {
        $exitosos = BitacoraAcceso::where('tipo_evento', self::EVENTO_LOGIN_EXITOSO)->count();
        $fallidos = BitacoraAcceso::where('tipo_evento', self::EVENTO_LOGIN_FALLIDO)->count();

        $ultimosEventos = BitacoraAcceso::with('usuario:id,nombre_completo,username,email')
            ->whereIn('tipo_evento', [self::EVENTO_LOGIN_EXITOSO, self::EVENTO_LOGIN_FALLIDO])
            ->orderByDesc('fecha_hora')
            ->limit(15)
            ->get();

        return [
            'totalExitosos' => $exitosos,
            'totalFallidos' => $fallidos,
            'tasaEfectividad' => ($exitosos + $fallidos) > 0 ? round(($exitosos / ($exitosos + $fallidos)) * 100, 2) : 100,
            'ultimosEventos' => $ultimosEventos,
        ];
    }
}

