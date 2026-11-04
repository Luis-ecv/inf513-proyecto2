<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Componente extends Model
{
    use HasFactory;

    protected $table = 'componente';

    protected $fillable = [
        'numero',
        'nombre',
        'descripcion',
        'id_plan_estudio',
    ];

    public function planEstudio()
    {
        return $this->belongsTo(PlanEstudio::class, 'id_plan_estudio');
    }

    public function capitulos()
    {
        return $this->hasMany(Capitulo::class, 'id_componente')->orderBy('numero');
    }
}

