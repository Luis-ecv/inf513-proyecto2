<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VersionCapitulo extends Model
{
    use HasFactory;

    protected $table = 'version_capitulo';

    protected $fillable = [
        'id_capitulo',
        'numero_version',
        'nombre_archivo',
        'archivo_ruta',
        'contenido_texto',
        'resumen_cambio',
        'id_usuario',
    ];

    protected function casts(): array
    {
        return [
            'numero_version' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function capitulo(): BelongsTo
    {
        return $this->belongsTo(Capitulo::class, 'id_capitulo');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_usuario');
    }
}
