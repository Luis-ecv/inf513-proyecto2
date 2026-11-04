<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreObservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'comentario' => ['required', 'string', 'min:5'],
            'cambiar_a_observado' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'comentario.required' => 'El comentario u observación técnica es obligatorio.',
            'comentario.min' => 'El comentario debe contener al menos 5 caracteres.',
        ];
    }
}

