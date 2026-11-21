<?php

namespace App\Mail;

use App\Models\ConvocatoriaReunion;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ConvocatoriaReunionMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public ConvocatoriaReunion $convocatoria,
        public string $pdfBytes,
        public string $icsContent,
        public string $googleCalendarUrl
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[CONVOCATORIA] {$this->convocatoria->titulo} ({$this->convocatoria->codigo_convocatoria})",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.convocatoria',
            with: [
                'convocatoria' => $this->convocatoria,
                'googleCalendarUrl' => $this->googleCalendarUrl,
            ],
        );
    }

    public function attachments(): array
    {
        $filename = "Carta_Convocatoria_{$this->convocatoria->codigo_convocatoria}.pdf";

        return [
            Attachment::fromData(fn() => $this->pdfBytes, $filename)
                ->withMime('application/pdf'),
            Attachment::fromData(fn() => $this->icsContent, 'invitacion_reunion.ics')
                ->withMime('text/calendar; charset=UTF-8; method=REQUEST'),
        ];
    }
}
