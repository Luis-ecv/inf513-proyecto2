<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'usuario';
    public $timestamps = false;

    protected $fillable = [
        'nombre_completo',
        'email',
        'username',
        'password',
        'password_hash',
        'foto_ruta',
        'activo',
        'fecha_registro',
        'id_rol',
    ];

    protected $hidden = [
        'password',
        'password_hash',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
            'fecha_registro' => 'datetime',
        ];
    }

    public function getAuthPasswordName(): string
    {
        return 'password_hash';
    }

    public function getAuthPassword(): ?string
    {
        return $this->password_hash ?? $this->attributes['password'] ?? null;
    }

    public function getPasswordAttribute(): ?string
    {
        return $this->attributes['password_hash'] ?? $this->attributes['password'] ?? null;
    }

    public function setPasswordAttribute(?string $value): void
    {
        if ($value) {
            $this->attributes['password_hash'] = hash('sha256', $value);
        }
    }

    public function rol()
    {
        return $this->belongsTo(Rol::class, 'id_rol');
    }

    public function capitulosAsignados()
    {
        return $this->belongsToMany(Capitulo::class, 'asignacion_capitulo', 'id_usuario', 'id_capitulo')
                    ->withPivot('fecha_asignacion');
    }

    public function observacionesRealizadas()
    {
        return $this->hasMany(Observacion::class, 'id_usuario_observador');
    }

    public function observacionesSubsanadas()
    {
        return $this->hasMany(Observacion::class, 'id_usuario_respuesta');
    }

    public function historialModificaciones()
    {
        return $this->hasMany(HistorialModificacion::class, 'id_usuario');
    }

    public function accesosBitacora()
    {
        return $this->hasMany(BitacoraAcceso::class, 'id_usuario');
    }

    public function esDirector(): bool
    {
        return $this->rol && strtolower($this->rol->nombre) === 'director';
    }

    public function esDelegado(): bool
    {
        return $this->rol && strtolower($this->rol->nombre) === 'delegado';
    }

    public function esInvitado(): bool
    {
        return $this->rol && strtolower($this->rol->nombre) === 'invitado';
    }

    public function tieneRol(string $nombreRol): bool
    {
        return $this->rol && strcasecmp($this->rol->nombre, $nombreRol) === 0;
    }
}
