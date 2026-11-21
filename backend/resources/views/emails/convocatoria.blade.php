<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Convocatoria Oficial a Reunión</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f1f5f9;
            margin: 0;
            padding: 24px;
            color: #1e293b;
        }
        .container {
            max-width: 620px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .header {
            background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
            color: #ffffff;
            padding: 28px 24px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 18px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 700;
        }
        .header p {
            margin: 6px 0 0 0;
            font-size: 13px;
            opacity: 0.85;
        }
        .body-content {
            padding: 28px 24px;
        }
        .greeting {
            font-size: 15px;
            font-weight: 600;
            margin-bottom: 14px;
            color: #0f172a;
        }
        .card-details {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 18px;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            margin-bottom: 10px;
            font-size: 13px;
        }
        .detail-row:last-child {
            margin-bottom: 0;
        }
        .detail-label {
            width: 110px;
            font-weight: bold;
            color: #475569;
        }
        .detail-value {
            flex: 1;
            color: #0f172a;
        }
        .agenda-box {
            margin: 22px 0;
        }
        .agenda-title {
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
            color: #1e3a8a;
            margin-bottom: 10px;
        }
        .agenda-list {
            margin: 0;
            padding-left: 20px;
            font-size: 13px;
            color: #334155;
        }
        .agenda-list li {
            margin-bottom: 8px;
        }
        .btn-calendar {
            display: inline-block;
            background-color: #2563eb;
            color: #ffffff !important;
            text-decoration: none;
            font-weight: 600;
            font-size: 13px;
            padding: 12px 20px;
            border-radius: 8px;
            margin: 15px 0 10px 0;
            text-align: center;
        }
        .btn-calendar:hover {
            background-color: #1d4ed8;
        }
        .attachments-note {
            background-color: #ecfdf5;
            border: 1px solid #a7f3d0;
            border-radius: 8px;
            padding: 12px 16px;
            font-size: 12px;
            color: #065f46;
            margin: 20px 0;
        }
        .footer {
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
            padding: 18px 24px;
            text-align: center;
            font-size: 11px;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>UAGRM - FICCT</h1>
            <p>Comisión de Rediseño Curricular • Ingeniería en Sistemas</p>
        </div>

        <div class="body-content">
            <div class="greeting">
                Estimado(a) Colega Docente,
            </div>

            <p style="font-size: 13px; line-height: 1.6; color: #334155;">
                Por disposición de la Dirección de Carrera y el Comité de Rediseño Curricular, se le convoca formalmente a la reunión de socialización y seguimiento de los avances del plan curricular.
            </p>

            <div class="card-details">
                <div class="detail-row">
                    <span class="detail-label">CÓDIGO:</span>
                    <span class="detail-value"><strong>{{ $convocatoria->codigo_convocatoria }}</strong></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">TÍTULO:</span>
                    <span class="detail-value">{{ $convocatoria->titulo }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">FECHA:</span>
                    <span class="detail-value"><strong>{{ \Carbon\Carbon::parse($convocatoria->fecha_reunion)->locale('es')->isoFormat('dddd D [de] MMMM [de] YYYY') }}</strong></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">HORA:</span>
                    <span class="detail-value"><strong>{{ $convocatoria->hora_reunion }} hrs.</strong></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">LUGAR:</span>
                    <span class="detail-value">{{ $convocatoria->lugar }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">MODALIDAD:</span>
                    <span class="detail-value">{{ ucfirst($convocatoria->modalidad) }}</span>
                </div>
                @if($convocatoria->enlace_virtual)
                <div class="detail-row">
                    <span class="detail-label">ENLACE MEET:</span>
                    <span class="detail-value"><a href="{{ $convocatoria->enlace_virtual }}" style="color: #2563eb;">{{ $convocatoria->enlace_virtual }}</a></span>
                </div>
                @endif
            </div>

            <div class="agenda-box">
                <div class="agenda-title">Orden del Día (Puntos a tratar):</div>
                <ol class="agenda-list">
                    @if(is_array($convocatoria->orden_del_dia))
                        @foreach($convocatoria->orden_del_dia as $item)
                            <li>
                                <strong>{{ is_array($item) ? ($item['punto'] ?? '') : (string) $item }}</strong>
                                @if(is_array($item) && !empty($item['enlace']))
                                    <div style="font-size: 11px; margin-top: 2px;">
                                        <a href="{{ $item['enlace'] }}" style="color: #2563eb;">Ver documento en plataforma</a>
                                    </div>
                                @endif
                            </li>
                        @endforeach
                    @endif
                </ol>
            </div>

            <div style="text-align: center; margin: 25px 0;">
                <a href="{{ $googleCalendarUrl }}" target="_blank" class="btn-calendar">
                    📅 Añadir evento a mi Google Calendar
                </a>
            </div>

            <div class="attachments-note">
                📎 <strong>Documentos adjuntos al correo:</strong><br>
                1. <strong>Carta_Convocatoria_{{ $convocatoria->codigo_convocatoria }}.pdf:</strong> Carta formal con membrete universitario y firma institucional.<br>
                2. <strong>invitacion_reunion.ics:</strong> Evento de calendario estándar universal para confirmar asistencia automática.
            </div>

            <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
                Atentamente,<br>
                <strong>Ing. Evans Balcázar Veizaga</strong><br>
                Director de Carrera - Ingeniería en Sistemas (FICCT - UAGRM)
            </p>
        </div>

        <div class="footer">
            Sistema Web de Seguimiento al Diseño Curricular • INF-513 Tecnología Web<br>
            Santa Cruz de la Sierra, Bolivia.
        </div>
    </div>
</body>
</html>
