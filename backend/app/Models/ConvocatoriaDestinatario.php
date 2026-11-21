<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConvocatoriaDestinatario extends Model
{
    protected $table = 'convocatoria_destinatario';

    protected $fillable = [
        'id_convocatoria',
        'id_usuario',
        'email_destinatario',
        'estado_envio',
        'fecha_envio',
    ];

    protected $casts = [
        'fecha_envio' => 'datetime',
    ];

    public function convocatoria(): BelongsTo
    {
        return $this->belongsTo(ConvocatoriaReunion::class, 'id_convocatoria');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'id_usuario');
    }
}
