<?php

namespace Database\Seeders;

use App\Models\EstadoCapitulo;
use Illuminate\Database\Seeder;

class EstadoCapituloSeeder extends Seeder
{
    public function run(): void
    {
        $estados = [
            [
                'id' => 1,
                'nombre' => 'Borrador',
                'descripcion' => 'En etapa inicial de redacción por parte de los delegados asignados',
            ],
            [
                'id' => 2,
                'nombre' => 'En Revisión',
                'descripcion' => 'Sometido a evaluación formal por la comisión o autoridades',
            ],
            [
                'id' => 3,
                'nombre' => 'Observado',
                'descripcion' => 'Presenta observaciones técnicas pendientes de subsanación',
            ],
            [
                'id' => 4,
                'nombre' => 'Aprobado',
                'descripcion' => 'Validado formalmente con observaciones subsanadas y evidencias adjuntas',
            ],
        ];

        foreach ($estados as $est) {
            EstadoCapitulo::updateOrCreate(['id' => $est['id']], $est);
        }
    }
}

