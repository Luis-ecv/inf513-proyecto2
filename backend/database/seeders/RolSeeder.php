<?php

namespace Database\Seeders;

use App\Models\Rol;
use Illuminate\Database\Seeder;

class RolSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'id' => 1,
                'nombre' => 'Director',
                'descripcion' => 'Director de Carrera y autoridades académicas con facultades de aprobación',
            ],
            [
                'id' => 2,
                'nombre' => 'Delegado',
                'descripcion' => 'Miembros de la comisión de rediseño curricular y redactores',
            ],
            [
                'id' => 3,
                'nombre' => 'Invitado',
                'descripcion' => 'Docentes y observadores externos con permisos de solo lectura',
            ],
        ];

        foreach ($roles as $rol) {
            Rol::updateOrCreate(['id' => $rol['id']], $rol);
        }
    }
}

