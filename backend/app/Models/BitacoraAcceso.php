<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BitacoraAcceso extends Model
{
    use HasFactory;

    protected $table = 'bitacora_acceso';

    public $timestamps = false;

    protected $fillable = [
        'id_usuario',
        'ip_address',
        'user_agent',
        'tipo_evento',
        'recurso_accedido',
        'metodo_http',
        'detalle',
        'fecha_hora',
    ];

    protected function casts(): array
    {
        return [
            'fecha_hora' => 'datetime',
        ];
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'id_usuario');
    }
}

