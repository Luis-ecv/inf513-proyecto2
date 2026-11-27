<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NuevoUsuarioCredencialesMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $usuario,
        public string $passwordTemporal,
        public string $loginUrl
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[ACCESO OFICIAL] Credenciales y Asignación de Rol - Sistema de Rediseño Curricular FICCT",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.nuevo_usuario',
            with: [
                'usuario' => $this->usuario,
                'passwordTemporal' => $this->passwordTemporal,
                'loginUrl' => $this->loginUrl,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
