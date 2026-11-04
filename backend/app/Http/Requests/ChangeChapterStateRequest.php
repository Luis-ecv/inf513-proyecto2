<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ChangeChapterStateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_estado' => ['required', 'integer', 'exists:estado_capitulo,id'],
            'justificacion_tecnica' => ['required', 'string', 'min:10', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'id_estado.required' => 'Debe indicar el nuevo estado del capítulo.',
            'id_estado.exists' => 'El estado seleccionado no es válido.',
            'justificacion_tecnica.required' => 'La justificación técnica es obligatoria para la auditoría histórica.',
            'justificacion_tecnica.min' => 'La justificación técnica debe contener al menos 10 caracteres explicando el motivo del cambio.',
            'justificacion_tecnica.max' => 'La justificación técnica no debe superar los 1000 caracteres.',
        ];
    }
}

