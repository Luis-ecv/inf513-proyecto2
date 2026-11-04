<?php

namespace Database\Seeders;

use App\Models\Asignatura;
use App\Models\Capitulo;
use App\Models\Componente;
use App\Models\DocumentoEvidencia;
use App\Models\PlanEstudio;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PlanEstudioSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Plan de Estudios Inicial (RF-01)
        $plan = PlanEstudio::updateOrCreate(
            ['codigo' => 'PLAN-187-4'],
            [
                'carrera' => 'Ingeniería en Sistemas',
                'anio_vigencia' => 2026,
                'descripcion' => 'Plan de Estudios Rediseñado para la carrera de Ingeniería en Sistemas',
                'objetivos' => 'Formar profesionales integrales en ciencias de la computación, desarrollo de software e ingeniería de sistemas.',
                'perfil_egreso' => 'El ingeniero en sistemas diseña, implementa y audita soluciones tecnológicas complejas.',
                'limite_creditos_min' => 200,
                'limite_creditos_max' => 260,
                'estado' => 'En Elaboración',
            ]
        );

        // 2. Componentes Temáticos del Rediseño (RF-05)
        $comp1 = Componente::updateOrCreate(
            ['numero' => 1, 'id_plan_estudio' => $plan->id],
            [
                'nombre' => 'Marco Referencial e Institucional',
                'descripcion' => 'Fundamentación contextual, normativa y visión institucional de la carrera.',
            ]
        );

        $comp2 = Componente::updateOrCreate(
            ['numero' => 2, 'id_plan_estudio' => $plan->id],
            [
                'nombre' => 'Fundamentación Pedagógica y Curricular',
                'descripcion' => 'Modelo formativo por competencias y lineamientos pedagógicos.',
            ]
        );

        $comp3 = Componente::updateOrCreate(
            ['numero' => 3, 'id_plan_estudio' => $plan->id],
            [
                'nombre' => 'Estructura Curricular y Malla',
                'descripcion' => 'Distribución de áreas formativas, cargas horarias y matriz de prelaciones.',
            ]
        );

        // 3. Capítulos iniciales (RF-05, RF-06)
        $cap1 = Capitulo::updateOrCreate(
            ['numero' => 1, 'id_componente' => $comp1->id],
            [
                'titulo' => 'Diagnóstico y Justificación del Rediseño',
                'contenido' => 'Análisis de demanda del mercado laboral y pertinencia social de la carrera.',
                'id_estado' => 1, // Borrador
            ]
        );

        $cap2 = Capitulo::updateOrCreate(
            ['numero' => 2, 'id_componente' => $comp1->id],
            [
                'titulo' => 'Marco Normativo y Resoluciones ICU',
                'contenido' => 'Normativa universitaria y resoluciones del Ilustre Consejo Universitario que sustentan el rediseño.',
                'id_estado' => 2, // En Revisión
            ]
        );

        $cap3 = Capitulo::updateOrCreate(
            ['numero' => 3, 'id_componente' => $comp2->id],
            [
                'titulo' => 'Perfil del Graduado y Competencias Clave',
                'contenido' => 'Definición detallada de competencias genéricas y específicas del futuro ingeniero.',
                'id_estado' => 3, // Observado
            ]
        );

        // Asignar redactor (Luis Fernando y Carlos Roca) al capítulo 1
        $cap1->redactores()->syncWithoutDetaching([2, 6]);
        $cap2->redactores()->syncWithoutDetaching([6]);
        $cap3->redactores()->syncWithoutDetaching([2]);

        // 4. Asignaturas iniciales para pruebas del Grafo de Prerrequisitos (RF-02, RF-03)
        $asignaturas = [
            // Semestre 1
            ['sigla' => 'INF110', 'nombre' => 'Introducción a la Informática', 'semestre' => 1, 'ht' => 4, 'hp' => 2, 'cr' => 5, 'area' => 'Programación'],
            ['sigla' => 'MAT101', 'nombre' => 'Cálculo I', 'semestre' => 1, 'ht' => 4, 'hp' => 2, 'cr' => 5, 'area' => 'Matemáticas'],
            ['sigla' => 'FIS100', 'nombre' => 'Física I', 'semestre' => 1, 'ht' => 4, 'hp' => 2, 'cr' => 5, 'area' => 'Ciencias Básicas'],
            ['sigla' => 'LIN100', 'nombre' => 'Inglés Técnico I', 'semestre' => 1, 'ht' => 2, 'hp' => 2, 'cr' => 3, 'area' => 'Humanidades'],

            // Semestre 2
            ['sigla' => 'INF120', 'nombre' => 'Programación I', 'semestre' => 2, 'ht' => 4, 'hp' => 2, 'cr' => 5, 'area' => 'Programación'],
            ['sigla' => 'MAT102', 'nombre' => 'Cálculo II', 'semestre' => 2, 'ht' => 4, 'hp' => 2, 'cr' => 5, 'area' => 'Matemáticas'],
            ['sigla' => 'MAT103', 'nombre' => 'Álgebra Lineal', 'semestre' => 2, 'ht' => 4, 'hp' => 2, 'cr' => 5, 'area' => 'Matemáticas'],

            // Semestre 3
            ['sigla' => 'INF210', 'nombre' => 'Programación II', 'semestre' => 3, 'ht' => 4, 'hp' => 2, 'cr' => 5, 'area' => 'Programación'],
            ['sigla' => 'INF211', 'nombre' => 'Arquitectura de Computadoras', 'semestre' => 3, 'ht' => 4, 'hp' => 2, 'cr' => 5, 'area' => 'Hardware'],
            ['sigla' => 'MAT207', 'nombre' => 'Ecuaciones Diferenciales', 'semestre' => 3, 'ht' => 4, 'hp' => 2, 'cr' => 5, 'area' => 'Matemáticas'],

            // Semestre 4
            ['sigla' => 'INF220', 'nombre' => 'Estructura de Datos I', 'semestre' => 4, 'ht' => 4, 'hp' => 2, 'cr' => 5, 'area' => 'Programación'],
            ['sigla' => 'INF221', 'nombre' => 'Sistemas Operativos I', 'semestre' => 4, 'ht' => 4, 'hp' => 2, 'cr' => 5, 'area' => 'Sistemas'],

            // Semestre 5
            ['sigla' => 'INF312', 'nombre' => 'Bases de Datos I', 'semestre' => 5, 'ht' => 4, 'hp' => 2, 'cr' => 5, 'area' => 'Bases de Datos'],
            ['sigla' => 'INF310', 'nombre' => 'Estructura de Datos II', 'semestre' => 5, 'ht' => 4, 'hp' => 2, 'cr' => 5, 'area' => 'Programación'],

            // Semestre 6
            ['sigla' => 'INF322', 'nombre' => 'Bases de Datos II', 'semestre' => 6, 'ht' => 4, 'hp' => 2, 'cr' => 5, 'area' => 'Bases de Datos'],
            ['sigla' => 'INF328', 'nombre' => 'Sistemas de Información I', 'semestre' => 6, 'ht' => 4, 'hp' => 2, 'cr' => 5, 'area' => 'Ingeniería de Software'],
        ];

        $mapAsignaturas = [];
        foreach ($asignaturas as $a) {
            $asig = Asignatura::updateOrCreate(
                ['sigla' => $a['sigla'], 'id_plan_estudio' => $plan->id],
                [
                    'nombre' => $a['nombre'],
                    'semestre' => $a['semestre'],
                    'horas_teoricas' => $a['ht'],
                    'horas_practicas' => $a['hp'],
                    'creditos' => $a['cr'],
                    'area_formativa' => $a['area'],
                ]
            );
            $mapAsignaturas[$a['sigla']] = $asig->id;
        }

        // 5. Prerrequisitos de ejemplo (DAG sin ciclos)
        $prerrequisitos = [
            ['INF120', 'INF110'], // INF120 requiere INF110
            ['MAT102', 'MAT101'], // MAT102 requiere MAT101
            ['INF210', 'INF120'], // INF210 requiere INF120
            ['INF220', 'INF210'], // INF220 requiere INF210
            ['INF310', 'INF220'], // INF310 requiere INF220
            ['INF312', 'INF220'], // INF312 requiere INF220
            ['INF322', 'INF312'], // INF322 requiere INF312
            ['INF328', 'INF312'], // INF328 requiere INF312
        ];

        foreach ($prerrequisitos as $pre) {
            $idAsig = $mapAsignaturas[$pre[0]] ?? null;
            $idReq = $mapAsignaturas[$pre[1]] ?? null;

            if ($idAsig && $idReq) {
                DB::table('prerrequisito')->updateOrInsert(
                    ['id_asignatura' => $idAsig, 'id_asignatura_requisito' => $idReq]
                );
            }
        }

        // 6. Documento de evidencia de prueba (RF-11)
        DocumentoEvidencia::updateOrCreate(
            ['codigo_norma' => 'RES-ICU-042/2026'],
            [
                'titulo' => 'Aprobación del Proceso de Rediseño Curricular 2026',
                'tipo_documento' => 'Resolución ICU',
                'organo_emisor' => 'Ilustre Consejo Universitario',
                'fecha_emision' => '2026-03-15',
                'archivo_ruta' => 'evidencias/resolucion_042_2026.pdf',
                'vigente' => true,
            ]
        );
    }
}

