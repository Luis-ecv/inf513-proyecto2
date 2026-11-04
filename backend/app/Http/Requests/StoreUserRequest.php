<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre_completo' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:150', 'unique:usuario,email'],
            'username' => ['required', 'string', 'max:50', 'unique:usuario,username'],
            'password' => [
                'required',
                'string',
                'min:8',
                'max:25',
                'regex:/^[a-zA-Z0-9ñÑ]+$/u', // Política estricta: alfanumérico + ñ/Ñ, sin símbolos ni espacios
            ],
            'id_rol' => ['required', 'integer', 'exists:rol,id'],
            'foto' => ['nullable', 'image', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'nombre_completo.required' => 'El nombre completo es obligatorio.',
            'email.required' => 'La dirección de correo electrónico es obligatoria.',
            'email.email' => 'El formato del correo electrónico no es válido.',
            'email.unique' => 'Este correo electrónico ya se encuentra registrado en el sistema.',
            'username.required' => 'El nombre de usuario es obligatorio.',
            'username.unique' => 'Este nombre de usuario ya está en uso.',
            'password.required' => 'La contraseña es obligatoria.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'password.max' => 'La contraseña no debe superar los 25 caracteres.',
            'password.regex' => 'La contraseña solo puede contener letras mayúsculas, minúsculas, números y la letra ñ/Ñ (sin símbolos, espacios ni acentos).',
            'id_rol.required' => 'Debe seleccionar un rol para el usuario.',
            'id_rol.exists' => 'El rol seleccionado no es válido.',
            'foto.image' => 'El archivo adjunto debe ser una imagen válida (JPG, PNG, WebP).',
            'foto.max' => 'La fotografía no debe exceder los 2 MB de tamaño.',
        ];
    }
}
