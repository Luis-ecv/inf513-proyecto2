<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentoEvidencia extends Model
{
    use HasFactory;

    protected $table = 'documento_evidencia';

    protected $fillable = [
        'codigo_norma',
        'titulo',
        'tipo_documento',
        'organo_emisor',
        'fecha_emision',
        'archivo_ruta',
        'vigente',
        'id_documento_padre',
    ];

    protected function casts(): array
    {
        return [
            'vigente' => 'boolean',
            'fecha_emision' => 'date',
        ];
    }

    public function documentoPadre()
    {
        return $this->belongsTo(DocumentoEvidencia::class, 'id_documento_padre');
    }

    public function documentosHijos()
    {
        return $this->hasMany(DocumentoEvidencia::class, 'id_documento_padre');
    }

    public function capitulos()
    {
        return $this->belongsToMany(
            Capitulo::class,
            'evidencia_capitulo',
            'id_documento_evidencia',
            'id_capitulo'
        )->withPivot('fecha_vinculacion');
    }

    public function asignaturas()
    {
        return $this->belongsToMany(
            Asignatura::class,
            'evidencia_asignatura',
            'id_documento_evidencia',
            'id_asignatura'
        )->withPivot('fecha_vinculacion');
    }
}

