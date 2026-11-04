<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Observacion extends Model
{
    use HasFactory;

    protected $table = 'observacion';

    protected $fillable = [
        'comentario',
        'respuesta_delegado',
        'fecha_respuesta',
        'resuelta',
        'fecha_cierre',
        'id_capitulo',
        'id_usuario_observador',
        'id_usuario_respuesta',
    ];

    protected function casts(): array
    {
        return [
            'resuelta' => 'boolean',
            'fecha_respuesta' => 'datetime',
            'fecha_cierre' => 'datetime',
        ];
    }

    public function capitulo()
    {
        return $this->belongsTo(Capitulo::class, 'id_capitulo');
    }

    public function observador()
    {
        return $this->belongsTo(User::class, 'id_usuario_observador');
    }

    public function redactorRespuesta()
    {
        return $this->belongsTo(User::class, 'id_usuario_respuesta');
    }
}

