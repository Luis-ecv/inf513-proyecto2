<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Capitulo extends Model
{
    use HasFactory;

    protected $table = 'capitulo';

    protected $fillable = [
        'numero',
        'titulo',
        'contenido',
        'id_componente',
        'id_estado',
    ];

    public function componente()
    {
        return $this->belongsTo(Componente::class, 'id_componente');
    }

    public function estado()
    {
        return $this->belongsTo(EstadoCapitulo::class, 'id_estado');
    }

    public function redactores()
    {
        return $this->belongsToMany(
            User::class,
            'asignacion_capitulo',
            'id_capitulo',
            'id_usuario'
        )->withPivot('fecha_asignacion');
    }

    public function observaciones()
    {
        return $this->hasMany(Observacion::class, 'id_capitulo')->orderBy('created_at', 'desc');
    }

    public function historial()
    {
        return $this->hasMany(HistorialModificacion::class, 'id_capitulo')->orderBy('fecha_hora', 'desc');
    }

    public function evidencias()
    {
        return $this->belongsToMany(
            DocumentoEvidencia::class,
            'evidencia_capitulo',
            'id_capitulo',
            'id_documento_evidencia'
        )->withPivot('fecha_vinculacion');
    }

    public function tieneObservacionesPendientes(): bool
    {
        return $this->observaciones()->where('resuelta', false)->exists();
    }

    public function tieneEvidenciasVinculadas(): bool
    {
        return $this->evidencias()->exists();
    }
}

