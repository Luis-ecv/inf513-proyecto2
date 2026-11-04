<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Asignatura extends Model
{
    use HasFactory;

    protected $table = 'asignatura';

    protected $fillable = [
        'sigla',
        'nombre',
        'semestre',
        'horas_teoricas',
        'horas_practicas',
        'creditos',
        'area_formativa',
        'id_plan_estudio',
    ];

    public function planEstudio()
    {
        return $this->belongsTo(PlanEstudio::class, 'id_plan_estudio');
    }

    /**
     * Materias que esta asignatura exige como prerrequisito (hacia atrás).
     */
    public function prerrequisitos()
    {
        return $this->belongsToMany(
            Asignatura::class,
            'prerrequisito',
            'id_asignatura',
            'id_asignatura_requisito'
        );
    }

    /**
     * Materias que dependen de esta asignatura para poder cursarse (hacia adelante).
     */
    public function materiasDependientes()
    {
        return $this->belongsToMany(
            Asignatura::class,
            'prerrequisito',
            'id_asignatura_requisito',
            'id_asignatura'
        );
    }

    public function evidencias()
    {
        return $this->belongsToMany(
            DocumentoEvidencia::class,
            'evidencia_asignatura',
            'id_asignatura',
            'id_documento_evidencia'
        )->withPivot('fecha_vinculacion');
    }
}

