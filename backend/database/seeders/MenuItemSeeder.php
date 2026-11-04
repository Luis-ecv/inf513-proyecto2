<?php

namespace Database\Seeders;

use App\Models\MenuItem;
use Illuminate\Database\Seeder;

class MenuItemSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            [
                'id' => 1,
                'titulo' => 'Tablero de Control',
                'ruta' => '/dashboard',
                'icono' => 'LayoutDashboard',
                'orden' => 1,
                'roles' => [1, 2, 3],
            ],
            [
                'id' => 2,
                'titulo' => 'Malla Curricular',
                'ruta' => '/malla',
                'icono' => 'BookOpen',
                'orden' => 2,
                'roles' => [1, 2, 3],
            ],
            [
                'id' => 3,
                'titulo' => 'Grafo de Prerrequisitos',
                'ruta' => '/grafo',
                'icono' => 'GitFork',
                'orden' => 3,
                'roles' => [1, 2, 3],
            ],
            [
                'id' => 4,
                'titulo' => 'Avance del Rediseño',
                'ruta' => '/redisenio',
                'icono' => 'FileText',
                'orden' => 4,
                'roles' => [1, 2, 3],
            ],
            [
                'id' => 5,
                'titulo' => 'Capítulos y Redacción',
                'ruta' => '/capitulos',
                'icono' => 'Layers',
                'orden' => 5,
                'roles' => [1, 2],
            ],
            [
                'id' => 6,
                'titulo' => 'Observaciones Técnicas',
                'ruta' => '/observaciones',
                'icono' => 'MessageSquare',
                'orden' => 6,
                'roles' => [1, 2],
            ],
            [
                'id' => 7,
                'titulo' => 'Repositorio de Evidencias',
                'ruta' => '/evidencias',
                'icono' => 'Archive',
                'orden' => 7,
                'roles' => [1, 2, 3],
            ],
            [
                'id' => 8,
                'titulo' => 'Reporte Oficial y PDF',
                'ruta' => '/reporte-final',
                'icono' => 'Printer',
                'orden' => 8,
                'roles' => [1, 2],
            ],
            [
                'id' => 9,
                'titulo' => 'Estadísticas del Negocio',
                'ruta' => '/estadisticas',
                'icono' => 'BarChart3',
                'orden' => 9,
                'roles' => [1, 2],
            ],
            [
                'id' => 10,
                'titulo' => 'Bitácora y Accesos',
                'ruta' => '/bitacora',
                'icono' => 'ShieldCheck',
                'orden' => 10,
                'roles' => [1],
            ],
            [
                'id' => 11,
                'titulo' => 'Gestión de Usuarios',
                'ruta' => '/usuarios',
                'icono' => 'Users',
                'orden' => 11,
                'roles' => [1],
            ],
        ];

        foreach ($items as $itemData) {
            $roles = $itemData['roles'];
            unset($itemData['roles']);

            $menuItem = MenuItem::updateOrCreate(
                ['id' => $itemData['id']],
                $itemData
            );

            $menuItem->roles()->sync($roles);
        }
    }
}

