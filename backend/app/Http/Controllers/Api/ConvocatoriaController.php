<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ConvocatoriaReunion;
use App\Models\ConvocatoriaDestinatario;
use App\Models\Usuario;
use App\Mail\ConvocatoriaReunionMail;
use App\Services\AuditBitacoraService;
use App\Services\CalendarIcsService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class ConvocatoriaController extends Controller
{
    public function __construct(
        protected AuditBitacoraService $auditService,
        protected CalendarIcsService $calendarService
    ) {}

    /**
     * Listado cronológico de convocatorias emitidas.
     */
    public function listarConvocatorias(Request $request): JsonResponse
    {
        $convocatorias = ConvocatoriaReunion::with([
            'convocador:id,nombre_completo,username,email',
            'destinatarios.usuario:id,nombre_completo,username,email,id_rol',
            'destinatarios.usuario.rol:id,nombre',
        ])
        ->orderByDesc('created_at')
        ->paginate(15);

        return response()->json([
            'success' => true,
            'convocatorias' => $convocatorias,
        ]);
    }

    /**
     * Emisión formal de una convocatoria con generación de PDF, .ics y despacho de correos.
     */
    public function storeConvocatoria(Request $request): JsonResponse
    {
        $request->validate([
            'titulo' => ['required', 'string', 'max:255'],
            'fecha_reunion' => ['required', 'date'],
            'hora_reunion' => ['required', 'string', 'max:20'],
            'lugar' => ['required', 'string', 'max:255'],
            'modalidad' => ['required', 'in:presencial,virtual,hibrida'],
            'enlace_virtual' => ['nullable', 'string', 'max:500'],
            'orden_del_dia' => ['required', 'array', 'min:1'],
            'orden_del_dia.*' => ['required'],
            'enlaces_documentos' => ['nullable', 'array'],
            'usuarios_ids' => ['required', 'array', 'min:1'],
            'usuarios_ids.*' => ['integer', 'exists:usuario,id'],
        ], [
            'titulo.required' => 'El título de la convocatoria es obligatorio.',
            'fecha_reunion.required' => 'La fecha de la reunión es obligatoria.',
            'hora_reunion.required' => 'La hora de la reunión es obligatoria.',
            'lugar.required' => 'El lugar o sala de la reunión es obligatorio.',
            'modalidad.required' => 'La modalidad de la sesión es obligatoria.',
            'orden_del_dia.required' => 'Debe ingresar al menos un punto en el orden del día.',
            'orden_del_dia.min' => 'Debe registrar al menos un punto o tema a tratar en la reunión.',
            'usuarios_ids.required' => 'Debe convocar al menos a un miembro de la comisión.',
            'usuarios_ids.min' => 'Debe seleccionar al menos a un docente destinatario.',
        ]);

        $usuarioAutenticado = $request->user();
        $anio = date('Y');
        $contadorAnual = ConvocatoriaReunion::whereYear('created_at', $anio)->count() + 1;
        $codigoConvocatoria = sprintf("CONV-DIR-%s-%03d", $anio, $contadorAnual);

        // 1. Cálculo de destinatarios y exclusiones
        $todosComision = Usuario::where('activo', true)
            ->where('id', '!=', $usuarioAutenticado->id)
            ->get();
        $totalComision = $todosComision->count();
        $convocadosIds = array_unique($request->input('usuarios_ids'));
        $totalConvocados = count($convocadosIds);
        $totalExcluidos = max(0, $totalComision - $totalConvocados);

        // 2. Crear registro en PostgreSQL
        $convocatoria = ConvocatoriaReunion::create([
            'codigo_convocatoria' => $codigoConvocatoria,
            'titulo' => trim($request->input('titulo')),
            'fecha_reunion' => $request->input('fecha_reunion'),
            'hora_reunion' => trim($request->input('hora_reunion')),
            'lugar' => trim($request->input('lugar')),
            'modalidad' => $request->input('modalidad'),
            'enlace_virtual' => $request->input('enlace_virtual') ? trim($request->input('enlace_virtual')) : null,
            'orden_del_dia' => $request->input('orden_del_dia'),
            'enlaces_documentos' => $request->input('enlaces_documentos') ?: [],
            'id_usuario_convocador' => $usuarioAutenticado->id,
            'total_convocados' => $totalConvocados,
            'total_excluidos' => $totalExcluidos,
        ]);

        // 3. Crear registros individuales de destinatarios
        $destinatariosUsuarios = Usuario::whereIn('id', $convocadosIds)->with('rol')->get();
        foreach ($destinatariosUsuarios as $dest) {
            ConvocatoriaDestinatario::create([
                'id_convocatoria' => $convocatoria->id,
                'id_usuario' => $dest->id,
                'email_destinatario' => $dest->email,
                'estado_envio' => 'pendiente',
            ]);
        }

        // 4. Generar la Carta Oficial en PDF binario
        $pdf = Pdf::loadView('pdf.convocatoria', [
            'convocatoria' => $convocatoria,
            'destinatarios' => $convocatoria->destinatarios()->with('usuario.rol')->get(),
        ])->setPaper('letter', 'portrait');

        $pdfBytes = $pdf->output();
        $nombreArchivoPdf = "convocatorias/Carta_{$codigoConvocatoria}.pdf";
        Storage::disk('public')->put($nombreArchivoPdf, $pdfBytes);

        $convocatoria->ruta_pdf = $nombreArchivoPdf;
        $convocatoria->save();

        // 5. Generar evento de calendario .ics y enlace de Google Calendar
        $icsContent = $this->calendarService->generarIcs($convocatoria);
        $googleCalendarUrl = $this->calendarService->generarGoogleCalendarLink($convocatoria);

        // 6. Despacho de Correos Electrónicos con manejo de contingencia
        $enviadosCorrectos = 0;
        $enviadosContingencia = 0;

        foreach ($destinatariosUsuarios as $dest) {
            try {
                Mail::to($dest->email)->send(
                    new ConvocatoriaReunionMail($convocatoria, $pdfBytes, $icsContent, $googleCalendarUrl)
                );

                ConvocatoriaDestinatario::where('id_convocatoria', $convocatoria->id)
                    ->where('id_usuario', $dest->id)
                    ->update([
                        'estado_envio' => 'enviado',
                        'fecha_envio' => now(),
                    ]);
                $enviadosCorrectos++;
            } catch (\Throwable $mailError) {
                Log::warning("Fallo envío SMTP a {$dest->email}: {$mailError->getMessage()}");

                ConvocatoriaDestinatario::where('id_convocatoria', $convocatoria->id)
                    ->where('id_usuario', $dest->id)
                    ->update([
                        'estado_envio' => 'contingencia_local',
                        'fecha_envio' => now(),
                    ]);
                $enviadosContingencia++;
            }
        }

        // 7. Registro de Auditoría Inmutable
        $this->auditService->registrarConvocatoriaReunion(
            $usuarioAutenticado,
            $codigoConvocatoria,
            $convocatoria->titulo,
            $totalConvocados,
            $totalExcluidos,
            $request
        );

        $mensajeExito = $enviadosContingencia === 0
            ? "Convocatoria {$codigoConvocatoria} emitida exitosamente. Se enviaron {$enviadosCorrectos} correos con la carta PDF y calendario adjuntos."
            : "Convocatoria {$codigoConvocatoria} emitida y registrada. ({$enviadosCorrectos} correos despachados vía SMTP, {$enviadosContingencia} respaldados en logs locales de contingencia).";

        return response()->json([
            'success' => true,
            'message' => $mensajeExito,
            'codigo_convocatoria' => $codigoConvocatoria,
            'convocatoria' => $convocatoria->load('destinatarios.usuario.rol'),
            'total_convocados' => $totalConvocados,
            'total_excluidos' => $totalExcluidos,
            'pdf_url' => asset("storage/{$nombreArchivoPdf}"),
        ], 201);
    }

    /**
     * Descarga directa del documento PDF de la convocatoria.
     */
    public function descargarPdf(int $id): Response
    {
        $convocatoria = ConvocatoriaReunion::findOrFail($id);

        if (!$convocatoria->ruta_pdf || !Storage::disk('public')->exists($convocatoria->ruta_pdf)) {
            // Re-generar si no existiera físicamente
            $pdf = Pdf::loadView('pdf.convocatoria', [
                'convocatoria' => $convocatoria,
                'destinatarios' => $convocatoria->destinatarios()->with('usuario.rol')->get(),
            ])->setPaper('letter', 'portrait');

            return response($pdf->output(), 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => "attachment; filename=\"Carta_{$convocatoria->codigo_convocatoria}.pdf\"",
            ]);
        }

        $archivo = Storage::disk('public')->get($convocatoria->ruta_pdf);

        return response($archivo, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "inline; filename=\"Carta_{$convocatoria->codigo_convocatoria}.pdf\"",
        ]);
    }

    /**
     * Previsualización en memoria de la Carta Oficial PDF antes de ser emitida o despachada.
     */
    public function previsualizarPdf(Request $request): Response
    {
        $request->validate([
            'titulo' => ['required', 'string', 'max:255'],
            'fecha_reunion' => ['required', 'date'],
            'hora_reunion' => ['required', 'string', 'max:20'],
            'lugar' => ['required', 'string', 'max:255'],
            'modalidad' => ['required', 'in:presencial,virtual,hibrida'],
            'enlace_virtual' => ['nullable', 'string', 'max:500'],
            'orden_del_dia' => ['required', 'array', 'min:1'],
            'usuarios_ids' => ['nullable', 'array'],
        ]);

        $usuarioAutenticado = $request->user();
        $anio = date('Y');
        $codigoBorrador = sprintf("CONV-DIR-%s-PREVIA", $anio);

        // Crear una instancia en memoria sin persistir en BD
        $convocatoria = new ConvocatoriaReunion([
            'codigo_convocatoria' => $codigoBorrador,
            'titulo' => trim($request->input('titulo')),
            'fecha_reunion' => $request->input('fecha_reunion'),
            'hora_reunion' => trim($request->input('hora_reunion')),
            'lugar' => trim($request->input('lugar')),
            'modalidad' => $request->input('modalidad'),
            'enlace_virtual' => $request->input('enlace_virtual') ? trim($request->input('enlace_virtual')) : null,
            'orden_del_dia' => $request->input('orden_del_dia'),
            'enlaces_documentos' => $request->input('enlaces_documentos') ?: [],
            'id_usuario_convocador' => $usuarioAutenticado ? $usuarioAutenticado->id : 1,
        ]);
        $convocatoria->created_at = now();

        $convocadosIds = $request->input('usuarios_ids', []);
        $destinatariosUsuarios = Usuario::whereIn('id', $convocadosIds)->with('rol')->get();

        $destinatariosColeccion = $destinatariosUsuarios->map(function ($u) {
            return (object)[
                'usuario' => $u,
                'email_destinatario' => $u->email,
            ];
        });

        $pdf = Pdf::loadView('pdf.convocatoria', [
            'convocatoria' => $convocatoria,
            'destinatarios' => $destinatariosColeccion,
        ])->setPaper('letter', 'portrait');

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "inline; filename=\"Borrador_Convocatoria.pdf\"",
        ]);
    }
}
