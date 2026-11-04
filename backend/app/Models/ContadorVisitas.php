<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContadorVisitas extends Model
{
    use HasFactory;

    protected $table = 'contador_visitas';

    public $timestamps = false;

    protected $fillable = [
        'ruta_pagina',
        'visitas',
        'ultima_visita',
    ];

    protected function casts(): array
    {
        return [
            'visitas' => 'integer',
            'ultima_visita' => 'datetime',
        ];
    }

    public static function incrementarVisita(string $ruta): int
    {
        $registro = static::firstOrCreate(
            ['ruta_pagina' => $ruta],
            ['visitas' => 0, 'ultima_visita' => now()]
        );

        $registro->increment('visitas');
        $registro->update(['ultima_visita' => now()]);

        return $registro->visitas;
    }
}

