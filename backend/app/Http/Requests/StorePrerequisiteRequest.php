<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePrerequisiteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_asignatura' => ['required', 'integer', 'exists:asignatura,id'],
            'id_asignatura_requisito' => ['required', 'integer', 'exists:asignatura,id', 'different:id_asignatura'],
        ];
    }

    public function messages(): array
    {
        return [
            'id_asignatura.required' => 'La asignatura destino es obligatoria.',
            'id_asignatura.exists' => 'La asignatura seleccionada no existe en el sistema.',
            'id_asignatura_requisito.required' => 'La asignatura requisito es obligatoria.',
            'id_asignatura_requisito.exists' => 'La asignatura requisito no existe en el sistema.',
            'id_asignatura_requisito.different' => 'Una asignatura no puede ser prerrequisito de sí misma.',
        ];
    }
}

