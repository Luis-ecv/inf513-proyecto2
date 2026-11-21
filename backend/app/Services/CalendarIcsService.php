<?php

namespace App\Services;

use App\Models\ConvocatoriaReunion;
use Carbon\Carbon;

class CalendarIcsService
{
    /**
     * Genera el contenido en formato iCalendar (.ics, RFC 5545) universal.
     */
    public function generarIcs(ConvocatoriaReunion $convocatoria): string
    {
        $fecha = Carbon::parse($convocatoria->fecha_reunion->format('Y-m-d') . ' ' . $convocatoria->hora_reunion);
        $fechaInicioUtc = $fecha->copy()->utc()->format('Ymd\THis\Z');
        $fechaFinUtc = $fecha->copy()->addHours(2)->utc()->format('Ymd\THis\Z');
        $nowUtc = Carbon::now()->utc()->format('Ymd\THis\Z');

        $puntos = '';
        if (is_array($convocatoria->orden_del_dia)) {
            foreach ($convocatoria->orden_del_dia as $i => $item) {
                $punto = is_array($item) ? ($item['punto'] ?? '') : (string) $item;
                $puntos .= ($i + 1) . '. ' . $punto . "\\n";
            }
        }

        $descripcion = "CONVOCATORIA OFICIAL - REDISEÑO CURRICULAR UAGRM\\n"
            . "Código: {$convocatoria->codigo_convocatoria}\\n\\n"
            . "ORDEN DEL DÍA:\\n" . $puntos . "\\n"
            . "Modalidad: " . ucfirst($convocatoria->modalidad) . "\\n"
            . ($convocatoria->enlace_virtual ? "Enlace de Conexión: {$convocatoria->enlace_virtual}\\n" : "");

        $location = $convocatoria->lugar . ($convocatoria->enlace_virtual ? ' (' . $convocatoria->enlace_virtual . ')' : '');

        $ics = "BEGIN:VCALENDAR\r\n"
            . "VERSION:2.0\r\n"
            . "PRODID:-//UAGRM FICCT//Comision Redisenio Curricular//ES\r\n"
            . "CALSCALE:GREGORIAN\r\n"
            . "METHOD:REQUEST\r\n"
            . "BEGIN:VEVENT\r\n"
            . "UID:convocatoria-{$convocatoria->id}-" . time() . "@tecnoweb.org.bo\r\n"
            . "DTSTAMP:{$nowUtc}\r\n"
            . "DTSTART:{$fechaInicioUtc}\r\n"
            . "DTEND:{$fechaFinUtc}\r\n"
            . "SUMMARY:" . $this->escaparIcs($convocatoria->titulo) . "\r\n"
            . "DESCRIPTION:" . $this->escaparIcs($descripcion) . "\r\n"
            . "LOCATION:" . $this->escaparIcs($location) . "\r\n"
            . "ORGANIZER;CN=Dirección de Carrera - Ingeniería en Sistemas:mailto:grupo02sa@tecnoweb.org.bo\r\n"
            . "STATUS:CONFIRMED\r\n"
            . "TRANSP:OPAQUE\r\n"
            . "SEQUENCE:0\r\n"
            . "END:VEVENT\r\n"
            . "END:VCALENDAR\r\n";

        return $ics;
    }

    /**
     * Genera un enlace directo para añadir a Google Calendar con un solo clic.
     */
    public function generarGoogleCalendarLink(ConvocatoriaReunion $convocatoria): string
    {
        $fecha = Carbon::parse($convocatoria->fecha_reunion->format('Y-m-d') . ' ' . $convocatoria->hora_reunion);
        $start = $fecha->copy()->utc()->format('Ymd\THis\Z');
        $end = $fecha->copy()->addHours(2)->utc()->format('Ymd\THis\Z');

        $puntos = '';
        if (is_array($convocatoria->orden_del_dia)) {
            foreach ($convocatoria->orden_del_dia as $i => $item) {
                $punto = is_array($item) ? ($item['punto'] ?? '') : (string) $item;
                $puntos .= ($i + 1) . '. ' . $punto . "\n";
            }
        }

        $details = "CONVOCATORIA: {$convocatoria->codigo_convocatoria}\n\nORDEN DEL DÍA:\n{$puntos}";
        if ($convocatoria->enlace_virtual) {
            $details .= "\nEnlace Videoconferencia: " . $convocatoria->enlace_virtual;
        }

        $params = http_build_query([
            'action' => 'TEMPLATE',
            'text' => $convocatoria->titulo,
            'dates' => "{$start}/{$end}",
            'details' => $details,
            'location' => $convocatoria->lugar,
        ]);

        return 'https://calendar.google.com/calendar/render?' . $params;
    }

    private function escaparIcs(string $text): string
    {
        return str_replace(["\r\n", "\n", "\r", ";", ","], ["\\n", "\\n", "\\n", "\;", "\,"], $text);
    }
}
