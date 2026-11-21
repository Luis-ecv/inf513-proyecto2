<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Carta de Convocatoria - {{ $convocatoria->codigo_convocatoria }}</title>
    <style>
        @page {
            margin: 2.5cm 2cm 2.5cm 2.5cm;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #1a202c;
            font-size: 11pt;
            line-height: 1.5;
        }
        .header {
            border-bottom: 2px solid #1e3a8a;
            padding-bottom: 12px;
            margin-bottom: 25px;
            text-align: center;
        }
        .header h1 {
            font-size: 13pt;
            margin: 0;
            text-transform: uppercase;
            color: #0f172a;
            font-weight: bold;
            letter-spacing: 0.5px;
        }
        .header h2 {
            font-size: 11pt;
            margin: 3px 0;
            color: #1e3a8a;
            font-weight: 600;
        }
        .header h3 {
            font-size: 10pt;
            margin: 0;
            color: #64748b;
            font-weight: normal;
        }
        .meta-box {
            margin-bottom: 20px;
        }
        .meta-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10pt;
        }
        .meta-table td {
            padding: 4px 0;
            vertical-align: top;
        }
        .meta-label {
            font-weight: bold;
            width: 120px;
            color: #334155;
        }
        .badge-cite {
            display: inline-block;
            background-color: #f1f5f9;
            border: 1px solid #cbd5e1;
            padding: 3px 8px;
            font-family: monospace;
            font-weight: bold;
            color: #1e3a8a;
            border-radius: 4px;
        }
        .subject-box {
            background-color: #f8fafc;
            border-left: 4px solid #1e3a8a;
            padding: 10px 14px;
            margin: 18px 0;
            font-size: 11pt;
            font-weight: bold;
            color: #0f172a;
        }
        .content p {
            text-align: justify;
            margin-bottom: 12px;
            text-indent: 25px;
        }
        .coords-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0 20px 0;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
        }
        .coords-table th, .coords-table td {
            border: 1px solid #cbd5e1;
            padding: 8px 12px;
            font-size: 10pt;
        }
        .coords-table th {
            background-color: #e2e8f0;
            color: #1e293b;
            text-align: left;
            width: 130px;
        }
        .agenda-title {
            font-size: 11pt;
            font-weight: bold;
            color: #1e3a8a;
            margin-top: 15px;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        .agenda-list {
            margin: 0 0 20px 20px;
            padding: 0;
        }
        .agenda-list li {
            margin-bottom: 6px;
            text-align: justify;
        }
        .doc-link {
            font-size: 9pt;
            color: #2563eb;
            text-decoration: underline;
        }
        .sign-area {
            margin-top: 45px;
            text-align: center;
        }
        .sign-line {
            display: inline-block;
            width: 250px;
            border-top: 1px solid #0f172a;
            margin-bottom: 5px;
        }
        .sign-name {
            font-weight: bold;
            font-size: 11pt;
        }
        .sign-role {
            font-size: 9pt;
            color: #64748b;
        }
        .footer-note {
            margin-top: 40px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 8px;
            font-size: 8pt;
            color: #94a3b8;
            text-align: center;
        }
    </style>
</head>
<body>

    <div class="header">
        <h1>Universidad Autónoma Gabriel René Moreno</h1>
        <h2>Facultad de Ciencias de la Computación y Telecomunicaciones</h2>
        <h3>Comisión de Rediseño Curricular - Carrera de Ingeniería en Sistemas</h3>
    </div>

    <div class="meta-box">
        <table class="meta-table">
            <tr>
                <td class="meta-label">CÓDIGO:</td>
                <td><span class="badge-cite">{{ $convocatoria->codigo_convocatoria }}</span></td>
                <td class="meta-label" style="text-align: right;">FECHA EMISIÓN:</td>
                <td style="text-align: right; width: 130px;">{{ \Carbon\Carbon::parse($convocatoria->created_at)->locale('es')->isoFormat('D [de] MMMM [de] YYYY') }}</td>
            </tr>
            <tr>
                <td class="meta-label">DE:</td>
                <td><strong>Ing. Evans Balcázar Veizaga</strong> (Director de Carrera / Presidente Comité)</td>
                <td></td>
                <td></td>
            </tr>
            <tr>
                <td class="meta-label">PARA:</td>
                <td colspan="3">
                    <strong>Miembros de la Comisión de Rediseño Curricular y Docentes Convocados:</strong><br>
                    <span style="font-size: 9.5pt; color: #475569;">
                        @foreach($destinatarios as $i => $dest)
                            {{ $dest->usuario->nombre_completo ?? 'Docente' }} ({{ $dest->usuario->rol->nombre ?? 'Comisión' }}){{ !$loop->last ? '; ' : '.' }}
                        @endforeach
                    </span>
                </td>
            </tr>
        </table>
    </div>

    <div class="subject-box">
        REF.: CONVOCATORIA A REUNIÓN ORDINARIA DE SOCIALIZACIÓN Y SEGUIMIENTO AL DISEÑO CURRICULAR
    </div>

    <div class="content">
        <p>
            De mi mayor consideración y estima institucional:
        </p>
        <p>
            En cumplimiento de la normativa académica universitaria y en el marco de las atribuciones conferidas a esta Dirección de Carrera y al Comité de Rediseño Curricular de la Carrera de Ingeniería en Sistemas, por medio del presente instrumento se <strong>CONVOCA FORMALMENTE</strong> a los señores docentes a la sesión de trabajo colegiado para el análisis, socialización y validación del avance curricular.
        </p>

        <table class="coords-table">
            <tr>
                <th>FECHA:</th>
                <td><strong>{{ \Carbon\Carbon::parse($convocatoria->fecha_reunion)->locale('es')->isoFormat('dddd, D [de] MMMM [de] YYYY') }}</strong></td>
            </tr>
            <tr>
                <th>HORA:</th>
                <td><strong>{{ $convocatoria->hora_reunion }} hrs.</strong> (Puntualidad recomendada)</td>
            </tr>
            <tr>
                <th>LUGAR / SALA:</th>
                <td>{{ $convocatoria->lugar }}</td>
            </tr>
            <tr>
                <th>MODALIDAD:</th>
                <td>
                    <strong>{{ ucfirst($convocatoria->modalidad) }}</strong>
                    @if($convocatoria->enlace_virtual)
                        <br><span style="font-size: 9pt;">Enlace Videoconferencia: <a href="{{ $convocatoria->enlace_virtual }}">{{ $convocatoria->enlace_virtual }}</a></span>
                    @endif
                </td>
            </tr>
        </table>

        <div class="agenda-title">ORDEN DEL DÍA (TEMAS A TRATAR):</div>
        <ol class="agenda-list">
            @if(is_array($convocatoria->orden_del_dia))
                @foreach($convocatoria->orden_del_dia as $item)
                    <li>
                        <strong>{{ is_array($item) ? ($item['punto'] ?? '') : (string) $item }}</strong>
                        @if(is_array($item) && !empty($item['enlace']))
                            <br><span class="doc-link">Documento en plataforma: {{ $item['enlace'] }}</span>
                        @endif
                    </li>
                @endforeach
            @endif
        </ol>

        <p>
            Agradeciendo de antemano su alto compromiso con la excelencia académica y el perfeccionamiento de los planes formativos de nuestra facultad, me despido con las consideraciones más distinguidas.
        </p>
    </div>

    <div class="sign-area">
        <div class="sign-line"></div><br>
        <span class="sign-name">Ing. Evans Balcázar Veizaga</span><br>
        <span class="sign-role">Director de Carrera - Ingeniería en Sistemas</span><br>
        <span class="sign-role">Facultad de Ciencias de la Computación y Telecomunicaciones - UAGRM</span>
    </div>

    <div class="footer-note">
        Documento oficial emitido y registrado en la bitácora criptográfica inmutable del Sistema de Seguimiento Curricular (TecnoWeb).<br>
        Santa Cruz de la Sierra, Bolivia.
    </div>

</body>
</html>
