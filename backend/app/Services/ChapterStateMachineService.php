<?php

namespace App\Services;

use App\Models\Capitulo;
use App\Models\EstadoCapitulo;
use App\Models\HistorialModificacion;
use App\Models\Observacion;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ChapterStateMachineService
{
    public const ESTADO_BORRADOR = 1;
    public const ESTADO_EN_REVISION = 2;
    public const ESTADO_OBSERVADO = 3;
    public const ESTADO_APROBADO = 4;

    /**
     * Ejecuta una transición formal de estado de un capítulo validando precondiciones y registrando auditoría (RF-06, RF-07, RF-10).
     *
     * @return array [success => bool, message => string, capitulo => ?Capitulo, code => int]
     */
    public function cambiarEstado(int $idCapitulo, int $nuevoEstadoId, string $justificacionTecnica, User $usuario): array
    {
        $capitulo = Capitulo::with(['estado', 'observaciones', 'evidencias'])->find($idCapitulo);
        if (!$capitulo) {
            return [
                'success' => false,
                'message' => 'El capítulo especificado no existe.',
                'capitulo' => null,
                'code' => 404,
            ];
        }

        $nuevoEstado = EstadoCapitulo::find($nuevoEstadoId);
        if (!$nuevoEstado) {
            return [
                'success' => false,
                'message' => 'El estado de destino no es válido.',
                'capitulo' => null,
                'code' => 422,
            ];
        }

        if ($capitulo->id_estado === $nuevoEstadoId) {
            return [
                'success' => false,
                'message' => "El capítulo ya se encuentra en estado '{$nuevoEstado->nombre}'.",
                'capitulo' => $capitulo,
                'code' => 400,
            ];
        }

        // Validación estricta para Aprobación (RF-07)
        if ($nuevoEstadoId === self::ESTADO_APROBADO) {
            $observacionesPendientes = $capitulo->observaciones()->where('resuelta', false)->count();
            if ($observacionesPendientes > 0) {
                return [
                    'success' => false,
                    'message' => "Transición rechazada: El capítulo no puede ser aprobado porque tiene {$observacionesPendientes} observación(es) técnica(s) pendiente(s) de subsanación.",
                    'capitulo' => $capitulo,
                    'code' => 422,
                ];
            }

            $evidenciasCount = $capitulo->evidencias()->count();
            if ($evidenciasCount === 0) {
                return [
                    'success' => false,
                    'message' => 'Transición rechazada: El capítulo debe contar con al menos una evidencia documental vinculada como requisito mandatorio para su aprobación formal.',
                    'capitulo' => $capitulo,
                    'code' => 422,
                ];
            }
        }

        $estadoAnteriorNombre = $capitulo->estado ? $capitulo->estado->nombre : 'Desconocido';

        DB::transaction(function () use ($capitulo, $nuevoEstadoId, $nuevoEstado, $estadoAnteriorNombre, $justificacionTecnica, $usuario) {
            // Actualizar estado del capítulo
            $capitulo->id_estado = $nuevoEstadoId;
            $capitulo->save();

            // Pista de auditoría inmutable (RF-10)
            HistorialModificacion::create([
                'estado_anterior' => $estadoAnteriorNombre,
                'estado_nuevo' => $nuevoEstado->nombre,
                'descripcion_accion' => "Cambio de estado de '{$estadoAnteriorNombre}' a '{$nuevoEstado->nombre}'",
                'justificacion_tecnica' => $justificacionTecnica,
                'fecha_hora' => now(),
                'id_capitulo' => $capitulo->id,
                'id_usuario' => $usuario->id,
            ]);
        });

        $capitulo->load(['estado', 'historial']);

        return [
            'success' => true,
            'message' => "Capítulo actualizado a estado '{$nuevoEstado->nombre}' con registro histórico inmutable.",
            'capitulo' => $capitulo,
            'code' => 200,
        ];
    }

    /**
     * Registra una observación técnica sobre un capítulo y opcionalmente lo pasa al estado 'Observado' (RF-08).
     */
    public function registrarObservacion(int $idCapitulo, string $comentario, User $autoridad, bool $cambiarAObservado = true): Observacion
    {
        return DB::transaction(function () use ($idCapitulo, $comentario, $autoridad, $cambiarAObservado) {
            $obs = Observacion::create([
                'comentario' => $comentario,
                'id_capitulo' => $idCapitulo,
                'id_usuario_observador' => $autoridad->id,
                'resuelta' => false,
            ]);

            if ($cambiarAObservado) {
                $cap = Capitulo::find($idCapitulo);
                if ($cap && $cap->id_estado !== self::ESTADO_OBSERVADO) {
                    $this->cambiarEstado(
                        $idCapitulo,
                        self::ESTADO_OBSERVADO,
                        "Transición automática por registro de observación técnica ID #{$obs->id}",
                        $autoridad
                    );
                }
            }

            return $obs;
        });
    }

    /**
     * Subsanación técnica de una observación por parte de un delegado/redactor (RF-08).
     */
    public function subsanarObservacion(int $idObservacion, string $respuesta, User $delegado): bool
    {
        $obs = Observacion::find($idObservacion);
        if (!$obs) {
            return false;
        }

        $obs->update([
            'respuesta_delegado' => $respuesta,
            'fecha_respuesta' => now(),
            'resuelta' => true,
            'fecha_cierre' => now(),
            'id_usuario_respuesta' => $delegado->id,
        ]);

        return true;
    }

    /**
     * Vincula un documento de evidencia a un capítulo (RF-13).
     */
    public function vincularEvidencia(int $idCapitulo, int $idDocumento): bool
    {
        $capitulo = Capitulo::find($idCapitulo);
        if (!$capitulo) {
            return false;
        }

        $capitulo->evidencias()->syncWithoutDetaching([$idDocumento]);
        return true;
    }

    /**
     * Desvincula un documento de evidencia de un capítulo.
     */
    public function desvincularEvidencia(int $idCapitulo, int $idDocumento): bool
    {
        $capitulo = Capitulo::find($idCapitulo);
        if (!$capitulo) {
            return false;
        }

        return $capitulo->evidencias()->detach($idDocumento) > 0;
    }
}

