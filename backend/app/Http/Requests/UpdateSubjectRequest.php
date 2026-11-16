<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSubjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $asignatura = $this->route('idAsignatura');

        return [
            'sigla' => ['required', 'string', 'max:15', Rule::unique('asignatura', 'sigla')->ignore($asignatura?->id ?? $asignatura)],
            'nombre' => ['required', 'string', 'max:120'],
            'semestre' => ['required', 'integer', 'between:1,10'],
            'horas_teoricas' => ['required', 'integer', 'min:0'],
            'horas_practicas' => ['required', 'integer', 'min:0'],
            'creditos' => ['required', 'integer', 'min:1'],
            'area_formativa' => ['required', 'string', 'max:80'],
        ];
    }

    public function messages(): array
    {
        return [
            'sigla.required' => 'La sigla de la materia es obligatoria.',
            'sigla.unique' => 'Ya existe otra asignatura con esta sigla.',
            'nombre.required' => 'El nombre de la materia es obligatorio.',
            'semestre.between' => 'El semestre debe estar comprendido entre 1 y 10.',
            'horas_teoricas.min' => 'Las horas teóricas no pueden ser negativas.',
            'horas_practicas.min' => 'Las horas prácticas no pueden ser negativas.',
            'creditos.min' => 'La materia debe otorgar al menos 1 crédito.',
            'area_formativa.required' => 'El área formativa es obligatoria.',
        ];
    }
}
