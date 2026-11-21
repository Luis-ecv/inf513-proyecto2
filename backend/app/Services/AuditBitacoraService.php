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
    public const EVENTO_BLOQUEO_FUERZA_BRUTA = 'bloqueo_fuerza_bruta';
    public const EVENTO_RESETEO_PASSWORD_ADMIN = 'reseteo_password_administrativo';
    public const EVENTO_CAMBIO_PASSWORD_OBLIGATORIO = 'cambio_password_primer_ingreso';
    public const EVENTO_ENTREGA_VERSION = 'entrega_version_capitulo';
    public const EVENTO_CONVOCATORIA_REUNION = 'convocatoria_reunion_enviada';

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
     * Registra un bloqueo de seguridad por exceso de intentos fallidos (Anti Fuerza Bruta).
     */
    public function registrarBloqueoFuerzaBruta(string $loginIntentado, Request $request, int $segundosEspera): void
    {
        $minutos = ceil($segundosEspera / 60);
        BitacoraAcceso::create([
            'id_usuario' => null,
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 500),
            'tipo_evento' => self::EVENTO_BLOQUEO_FUERZA_BRUTA,
            'recurso_accedido' => '/api/auth/login',
            'metodo_http' => 'POST',
            'detalle' => "ALERTA DE SEGURIDAD: Límite de 5 intentos fallidos superado para '{$loginIntentado}'. Acceso bloqueado temporalmente por {$minutos} minuto(s) ({$segundosEspera}s).",
            'fecha_hora' => now(),
        ]);
    }

    /**
     * Registra el restablecimiento administrativo de contraseña efectuado por un Director.
     */
    public function registrarReseteoPasswordAdmin(User $director, User $usuarioAfectado, Request $request): void
    {
        BitacoraAcceso::create([
            'id_usuario' => $director->id,
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 500),
            'tipo_evento' => self::EVENTO_RESETEO_PASSWORD_ADMIN,
            'recurso_accedido' => "/api/usuarios/{$usuarioAfectado->id}/reset-password",
            'metodo_http' => 'POST',
            'detalle' => "ADMINISTRACIÓN: El Director '{$director->username}' ({$director->nombre_completo}) restableció la contraseña temporal del usuario '{$usuarioAfectado->username}' ({$usuarioAfectado->email}) y exigió cambio obligatorio.",
            'fecha_hora' => now(),
        ]);
    }

    /**
     * Registra el cambio obligatorio de contraseña completado por el usuario en su primer ingreso.
     */
    public function registrarCambioPasswordObligatorio(User $usuario, Request $request): void
    {
        BitacoraAcceso::create([
            'id_usuario' => $usuario->id,
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 500),
            'tipo_evento' => self::EVENTO_CAMBIO_PASSWORD_OBLIGATORIO,
            'recurso_accedido' => '/api/auth/cambiar-password-obligatorio',
            'metodo_http' => 'POST',
            'detalle' => "SEGURIDAD: El usuario '{$usuario->username}' ({$usuario->email}) actualizó exitosamente su contraseña temporal por una contraseña personal definitiva.",
            'fecha_hora' => now(),
        ]);
    }

    /**
     * Registra la entrega de una nueva versión de documento en un capítulo.
     */
    public function registrarEntregaVersion(User $usuario, int $idCapitulo, int $numeroVersion, string $nombreArchivo, ?Request $request = null): BitacoraAcceso
    {
        $ip = $request?->ip() ?? request()?->ip() ?? '127.0.0.1';
        $userAgent = $request?->userAgent() ?? request()?->userAgent() ?? 'System/Internal';

        return BitacoraAcceso::create([
            'id_usuario' => $usuario->id,
            'ip_address' => $ip,
            'user_agent' => substr((string) $userAgent, 0, 500),
            'tipo_evento' => self::EVENTO_ENTREGA_VERSION,
            'recurso_accedido' => "/api/capitulos/{$idCapitulo}/versiones",
            'metodo_http' => 'POST',
            'detalle' => "DOCUMENTO: El usuario '{$usuario->username}' ({$usuario->nombre_completo}) publicó la Versión #{$numeroVersion} ('{$nombreArchivo}') para el Capítulo #{$idCapitulo}.",
            'fecha_hora' => now(),
        ]);
    }

    /**
     * Registra el envío formal de una convocatoria a reunión.
     */
    public function registrarConvocatoriaReunion(User $usuario, string $codigoConvocatoria, string $titulo, int $totalConvocados, int $totalExcluidos, ?Request $request = null): BitacoraAcceso
    {
        $ip = $request?->ip() ?? request()?->ip() ?? '127.0.0.1';
        $userAgent = $request?->userAgent() ?? request()?->userAgent() ?? 'System/Internal';

        $detalleExclusion = $totalExcluidos > 0
            ? " (Atención: {$totalExcluidos} docente(s) de la comisión fueron excluidos)"
            : " (Convocatoria plena: 100% de la comisión convocada)";

        return BitacoraAcceso::create([
            'id_usuario' => $usuario->id,
            'ip_address' => $ip,
            'user_agent' => substr((string) $userAgent, 0, 500),
            'tipo_evento' => self::EVENTO_CONVOCATORIA_REUNION,
            'recurso_accedido' => '/api/convocatorias',
            'metodo_http' => 'POST',
            'detalle' => "CONVOCATORIA: El Director '{$usuario->username}' emitió la Convocatoria '{$codigoConvocatoria}' ({$titulo}) a {$totalConvocados} docente(s){$detalleExclusion}.",
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
            'recurso_accedido' => $request->path(),
            'metodo_http' => $request->method(),
            'detalle' => "Acceso a recurso [{$request->method()}] /{$request->path()}",
            'fecha_hora' => now(),
        ]);
    }

    /**
     * Retorna el listado paginado o completo de la bitácora para auditoría de directores.
     */
    public function obtenerBitacora(int $limite = 50)
    {
        return BitacoraAcceso::with('usuario')
            ->orderBy('fecha_hora', 'desc')
            ->limit($limite)
            ->get();
    }

    /**
     * Retorna los recursos de la API con mayor índice de acceso (Requisito 4).
     */
    public function obtenerRecursosMasAccedidos(int $limite = 10)
    {
        return BitacoraAcceso::select('recurso_accedido', DB::raw('count(*) as total_accesos'))
            ->whereNotNull('recurso_accedido')
            ->groupBy('recurso_accedido')
            ->orderByDesc('total_accesos')
            ->limit($limite)
            ->get();
    }

    /**
     * Retorna estadísticas consolidadas de inicios de sesión exitosos vs fallidos (Requisito 4 y 8).
     */
    public function obtenerEstadisticasLogins(): array
    {
        $exitosos = BitacoraAcceso::where('tipo_evento', self::EVENTO_LOGIN_EXITOSO)->count();
        $fallidos = BitacoraAcceso::where('tipo_evento', self::EVENTO_LOGIN_FALLIDO)->count();
        $total = $exitosos + $fallidos;

        return [
            'totalExitosos' => $exitosos,
            'totalFallidos' => $fallidos,
            'tasaEfectividad' => $total > 0 ? round(($exitosos / $total) * 100, 2) : 100,
        ];
    }

    /**
     * Métricas de tráfico para el Dashboard de Auditoría.
     */
    public function obtenerMetricasAcceso(): array
    {
        $totalLoginsExitosos = BitacoraAcceso::where('tipo_evento', self::EVENTO_LOGIN_EXITOSO)->count();
        $totalLoginsFallidos = BitacoraAcceso::where('tipo_evento', self::EVENTO_LOGIN_FALLIDO)->count();

        $recursosMasAccedidos = BitacoraAcceso::select('recurso_accedido', DB::raw('count(*) as total'))
            ->whereNotNull('recurso_accedido')
            ->groupBy('recurso_accedido')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        $ultimosAccesos = BitacoraAcceso::with('usuario:id,nombre_completo,username,email')
            ->orderByDesc('fecha_hora')
            ->limit(10)
            ->get();

        return [
            'totalLoginsExitosos' => $totalLoginsExitosos,
            'totalLoginsFallidos' => $totalLoginsFallidos,
            'recursosMasAccedidos' => $recursosMasAccedidos,
            'ultimosAccesos' => $ultimosAccesos,
        ];
    }
}
