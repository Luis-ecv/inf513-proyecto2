<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubsanarObservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'respuesta_delegado' => ['required', 'string', 'min:5'],
        ];
    }

    public function messages(): array
    {
        return [
            'respuesta_delegado.required' => 'La respuesta técnica de subsanación es obligatoria.',
            'respuesta_delegado.min' => 'La respuesta de subsanación debe tener al menos 5 caracteres.',
        ];
    }
}

