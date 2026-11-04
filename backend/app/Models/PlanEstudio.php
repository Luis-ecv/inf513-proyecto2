<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PlanEstudio extends Model
{
    use HasFactory;

    protected $table = 'plan_estudio';

    protected $fillable = [
        'codigo',
        'carrera',
        'anio_vigencia',
        'descripcion',
        'objetivos',
        'perfil_egreso',
        'limite_creditos_min',
        'limite_creditos_max',
        'estado',
    ];

    public function asignaturas()
    {
        return $this->hasMany(Asignatura::class, 'id_plan_estudio')->orderBy('semestre')->orderBy('sigla');
    }

    public function componentes()
    {
        return $this->hasMany(Componente::class, 'id_plan_estudio')->orderBy('numero');
    }
}

