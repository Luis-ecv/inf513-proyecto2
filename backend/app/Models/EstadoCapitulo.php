<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EstadoCapitulo extends Model
{
    use HasFactory;

    protected $table = 'estado_capitulo';

    protected $fillable = [
        'nombre',
        'descripcion',
    ];

    public function capitulos()
    {
        return $this->hasMany(Capitulo::class, 'id_estado');
    }
}

