<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RolSeeder::class,
            EstadoCapituloSeeder::class,
            UsuarioSeeder::class,
            MenuItemSeeder::class,
            PlanEstudioSeeder::class,
        ]);

        // Sincronizar secuencias de PostgreSQL para evitar colisiones de clave primaria
        $tablasConSecuencia = [
            'usuario',
            'rol',
            'estado_capitulo',
            'plan_estudio',
            'componente',
            'capitulo',
            'asignatura',
            'menu_item',
            'documento_evidencia',
            'observacion',
            'historial_modificacion',
            'bitacora_acceso',
            'contador_visitas',
        ];

        foreach ($tablasConSecuencia as $tabla) {
            DB::statement("SELECT setval(pg_get_serial_sequence('{$tabla}', 'id'), COALESCE(max(id), 1)) FROM {$tabla}");
        }
    }
}
