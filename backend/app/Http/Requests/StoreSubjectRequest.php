<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSubjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'sigla' => ['required', 'string', 'max:15'],
            'nombre' => ['required', 'string', 'max:120'],
            'semestre' => ['required', 'integer', 'between:1,10'],
            'horas_teoricas' => ['required', 'integer', 'min:0'],
            'horas_practicas' => ['required', 'integer', 'min:0'],
            'creditos' => ['required', 'integer', 'min:1'],
            'area_formativa' => ['required', 'string', 'max:80'],
            'id_plan_estudio' => ['required', 'integer', 'exists:plan_estudio,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'sigla.required' => 'La sigla de la materia es obligatoria.',
            'nombre.required' => 'El nombre de la materia es obligatorio.',
            'semestre.required' => 'El semestre es obligatorio.',
            'semestre.between' => 'El semestre debe estar comprendido entre 1 y 10.',
            'horas_teoricas.required' => 'Las horas teóricas son obligatorias.',
            'horas_teoricas.min' => 'Las horas teóricas no pueden ser negativas.',
            'horas_practicas.required' => 'Las horas prácticas son obligatorias.',
            'horas_practicas.min' => 'Las horas prácticas no pueden ser negativas.',
            'creditos.required' => 'El número de créditos es obligatorio.',
            'creditos.min' => 'La materia debe otorgar al menos 1 crédito.',
            'area_formativa.required' => 'El área formativa es obligatoria.',
            'id_plan_estudio.required' => 'Debe asociar la materia a un plan de estudios.',
            'id_plan_estudio.exists' => 'El plan de estudios seleccionado no existe.',
        ];
    }
}

