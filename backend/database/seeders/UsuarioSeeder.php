<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UsuarioSeeder extends Seeder
{
    public function run(): void
    {
        $usuarios = [
            [
                'id' => 1,
                'nombre_completo' => 'Ing. Evans Balcazar',
                'email' => 'grupo02sa@tecnoweb.org.bo',
                'username' => 'director',
                'password' => Hash::make('admin123'),
                'foto_ruta' => 'fotos/director.png',
                'activo' => true,
                'id_rol' => 1,
            ],
            [
                'id' => 2,
                'nombre_completo' => 'Luis Fernando',
                'email' => 'luis.ecv1111@gmail.com',
                'username' => 'luisecv',
                'password' => Hash::make('Admin2026ñ'),
                'foto_ruta' => 'fotos/luis.png',
                'activo' => true,
                'id_rol' => 1,
            ],
            [
                'id' => 3,
                'nombre_completo' => 'Carlos Marca',
                'email' => 'marcacarlosestudio@gmail.com',
                'username' => 'cmarca',
                'password' => Hash::make('Admin2026ñ'),
                'foto_ruta' => 'fotos/carlos.png',
                'activo' => true,
                'id_rol' => 1,
            ],
            [
                'id' => 4,
                'nombre_completo' => 'Tania Valda',
                'email' => 'taniavaldadonozo@gmail.com',
                'username' => 'tvalda',
                'password' => Hash::make('Admin2026ñ'),
                'foto_ruta' => 'fotos/tania.png',
                'activo' => true,
                'id_rol' => 1,
            ],
            [
                'id' => 5,
                'nombre_completo' => 'The Criptale',
                'email' => 'thecriptale@gmail.com',
                'username' => 'criptale',
                'password' => Hash::make('Admin2026ñ'),
                'foto_ruta' => 'fotos/criptale.png',
                'activo' => true,
                'id_rol' => 1,
            ],
            [
                'id' => 6,
                'nombre_completo' => 'Lic. Carlos Roca (Delegado Curricular)',
                'email' => 'croca@uagrm.edu.bo',
                'username' => 'croca',
                'password' => Hash::make('Delegado2026ñ'),
                'foto_ruta' => 'fotos/croca.png',
                'activo' => true,
                'id_rol' => 2,
            ],
            [
                'id' => 7,
                'nombre_completo' => 'Dr. Mario Mendoza (Docente Invitado)',
                'email' => 'mmendoza@uagrm.edu.bo',
                'username' => 'mmendoza',
                'password' => Hash::make('Invitado2026ñ'),
                'foto_ruta' => 'fotos/default.png',
                'activo' => true,
                'id_rol' => 3,
            ],
        ];

        foreach ($usuarios as $u) {
            User::updateOrCreate(
                ['email' => $u['email']],
                $u
            );
        }
    }
}

