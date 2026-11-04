<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HistorialModificacion extends Model
{
    use HasFactory;

    protected $table = 'historial_modificacion';

    public $timestamps = false;

    protected $fillable = [
        'estado_anterior',
        'estado_nuevo',
        'descripcion_accion',
        'justificacion_tecnica',
        'fecha_hora',
        'id_capitulo',
        'id_usuario',
    ];

    protected function casts(): array
    {
        return [
            'fecha_hora' => 'datetime',
        ];
    }

    public function capitulo()
    {
        return $this->belongsTo(Capitulo::class, 'id_capitulo');
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'id_usuario');
    }
}

