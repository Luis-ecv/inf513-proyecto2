<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEvidenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'codigo_norma' => ['required', 'string', 'max:80', 'unique:documento_evidencia,codigo_norma'],
            'titulo' => ['required', 'string', 'max:200'],
            'tipo_documento' => ['required', 'string', 'max:60'],
            'organo_emisor' => ['required', 'string', 'max:120'],
            'fecha_emision' => ['required', 'date'],
            'archivo' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'], // 10MB
            'id_documento_padre' => ['nullable', 'integer', 'exists:documento_evidencia,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'codigo_norma.required' => 'El código o número de norma es obligatorio.',
            'codigo_norma.unique' => 'Este código de norma ya se encuentra registrado.',
            'titulo.required' => 'El título o descripción del documento es obligatorio.',
            'tipo_documento.required' => 'Debe especificar el tipo de documento (Resolución, Acta, Dictamen, etc.).',
            'organo_emisor.required' => 'El órgano emisor institucional es obligatorio.',
            'fecha_emision.required' => 'La fecha de emisión del documento es obligatoria.',
            'fecha_emision.date' => 'La fecha de emisión debe ser una fecha válida.',
            'archivo.required' => 'Debe adjuntar el archivo digital de respaldo.',
            'archivo.mimes' => 'El archivo adjunto debe ser de formato PDF o imagen (JPG, PNG).',
            'archivo.max' => 'El archivo digital no debe exceder los 10 MB.',
            'id_documento_padre.exists' => 'El documento normativo padre no existe.',
        ];
    }
}

