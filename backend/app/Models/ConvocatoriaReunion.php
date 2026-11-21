<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ConvocatoriaReunion extends Model
{
    protected $table = 'convocatoria_reunion';

    protected $fillable = [
        'codigo_convocatoria',
        'titulo',
        'fecha_reunion',
        'hora_reunion',
        'lugar',
        'modalidad',
        'enlace_virtual',
        'orden_del_dia',
        'enlaces_documentos',
        'ruta_pdf',
        'id_usuario_convocador',
        'total_convocados',
        'total_excluidos',
    ];

    protected $casts = [
        'fecha_reunion' => 'date',
        'orden_del_dia' => 'array',
        'enlaces_documentos' => 'array',
        'total_convocados' => 'integer',
        'total_excluidos' => 'integer',
    ];

    public function convocador(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'id_usuario_convocador');
    }

    public function destinatarios(): HasMany
    {
        return $this->hasMany(ConvocatoriaDestinatario::class, 'id_convocatoria');
    }
}
