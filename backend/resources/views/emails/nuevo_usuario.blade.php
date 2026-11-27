<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Credenciales de Acceso al Sistema</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f1f5f9;
            margin: 0;
            padding: 24px;
            color: #1e293b;
            line-height: 1.5;
        }
        .container {
            max-width: 640px;
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
            font-size: 17px;
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
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 12px;
            color: #0f172a;
        }
        .intro-text {
            font-size: 14px;
            color: #334155;
            margin-bottom: 20px;
        }
        .credentials-card {
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .credentials-card h2 {
            margin-top: 0;
            font-size: 14px;
            text-transform: uppercase;
            color: #0369a1;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 8px;
        }
        .cred-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px dashed #e2e8f0;
            font-size: 14px;
        }
        .cred-row:last-child {
            border-bottom: none;
        }
        .cred-label {
            font-weight: 600;
            color: #64748b;
        }
        .cred-value {
            font-family: monospace;
            font-size: 15px;
            font-weight: 700;
            color: #0f172a;
        }
        .cred-badge {
            display: inline-block;
            background-color: #0284c7;
            color: #ffffff;
            font-weight: 700;
            padding: 3px 10px;
            border-radius: 9999px;
            font-size: 12px;
        }
        .temp-password {
            background-color: #fef3c7;
            color: #b45309;
            border: 1px solid #fde68a;
            padding: 4px 10px;
            border-radius: 6px;
            font-family: monospace;
            font-size: 16px;
            letter-spacing: 1px;
        }
        .security-alert {
            background-color: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 14px;
            border-radius: 0 6px 6px 0;
            margin: 20px 0;
            font-size: 13px;
            color: #92400e;
        }
        .btn-container {
            text-align: center;
            margin: 24px 0;
        }
        .btn-login {
            display: inline-block;
            background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 28px;
            font-weight: 600;
            border-radius: 8px;
            font-size: 14px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .table-section {
            margin-top: 28px;
        }
        .table-section h3 {
            font-size: 14px;
            text-transform: uppercase;
            color: #334155;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
        }
        .roles-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-top: 10px;
        }
        .roles-table th, .roles-table td {
            border: 1px solid #cbd5e1;
            padding: 10px 12px;
            text-align: left;
            vertical-align: top;
        }
        .roles-table th {
            background-color: #f1f5f9;
            color: #475569;
            font-weight: 700;
        }
        .roles-table tr.active-role {
            background-color: #f0fdf4;
            border: 2px solid #22c55e;
        }
        .badge-active {
            display: inline-block;
            background-color: #16a34a;
            color: #ffffff;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: bold;
            margin-left: 6px;
        }
        .footer {
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
            padding: 18px 24px;
            font-size: 12px;
            color: #64748b;
            text-align: center;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>UNIVERSIDAD AUTÓNOMA GABRIEL RENÉ MORENO</h1>
            <p>FACULTAD DE INGENIERÍA EN CIENCIAS DE LA COMPUTACIÓN Y TELECOMUNICACIONES<br>Comisión de Rediseño Curricular - Carrera de Ingeniería en Sistemas</p>
        </div>

        <div class="body-content">
            <div class="greeting">Estimado(a) {{ $usuario->nombre_completo }},</div>
            <div class="intro-text">
                Se ha habilitado formalmente su cuenta de acceso institucional en la plataforma de <strong>Seguimiento al Rediseño Curricular</strong> de la FICCT - UAGRM. A continuación se detallan sus credenciales de ingreso:
            </div>

            <div class="credentials-card">
                <h2>Credenciales de Acceso</h2>
                <div class="cred-row">
                    <span class="cred-label">Usuario / Username:</span>
                    <span class="cred-value">{{ $usuario->username }}</span>
                </div>
                <div class="cred-row">
                    <span class="cred-label">Correo Registrado:</span>
                    <span class="cred-value">{{ $usuario->email }}</span>
                </div>
                <div class="cred-row">
                    <span class="cred-label">Rol Asignado:</span>
                    <span class="cred-badge">{{ $usuario->rol?->nombre ?? 'Usuario' }}</span>
                </div>
                <div class="cred-row">
                    <span class="cred-label">Contraseña Temporal:</span>
                    <span class="temp-password">{{ $passwordTemporal }}</span>
                </div>
            </div>

            <div class="security-alert">
                <strong>⚠️ Obligación de Cambio de Contraseña (ADR-006):</strong><br>
                Esta contraseña es de carácter estrictamente temporal. En cumplimiento con la política de seguridad institucional, en su primer inicio de sesión el sistema le exigirá definir una contraseña definitiva personal antes de permitir la navegación.
            </div>

            <div class="btn-container">
                <a href="{{ $loginUrl }}" target="_blank" class="btn-login">Ingresar a la Plataforma</a>
            </div>

            <div class="table-section">
                <h3>Matriz Institucional de Actividades Permitidas por Rol</h3>
                <p style="font-size: 12px; color: #64748b; margin-top: 0;">
                    Su cuenta cuenta con los privilegios correspondientes a la fila destacada en verde:
                </p>

                @php
                    $rolActual = strtolower(trim($usuario->rol?->nombre ?? ''));
                @endphp

                <table class="roles-table">
                    <thead>
                        <tr>
                            <th style="width: 25%;">Rol</th>
                            <th style="width: 45%;">Actividades y Módulos Permitidos</th>
                            <th style="width: 30%;">Restricciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="{{ $rolActual === 'director' ? 'active-role' : '' }}">
                            <td>
                                <strong>Director</strong>
                                @if($rolActual === 'director')
                                    <span class="badge-active">SU ROL</span>
                                @endif
                            </td>
                            <td>
                                • Gestión de usuarios y reseteo administrativo de claves.<br>
                                • Emisión formal de convocatorias y citaciones por correo con PDF e invitación .ics.<br>
                                • Aprobación, observación o rechazo final de capítulos.<br>
                                • Auditoría inmutable mediante Bitácora de Accesos.<br>
                                • Administración y visualización del grafo de prerrequisitos.
                            </td>
                            <td>
                                Ninguna. Rol de máxima autoridad académica.
                            </td>
                        </tr>
                        <tr class="{{ $rolActual === 'delegado' ? 'active-role' : '' }}">
                            <td>
                                <strong>Delegado</strong>
                                @if($rolActual === 'delegado')
                                    <span class="badge-active">SU ROL</span>
                                @endif
                            </td>
                            <td>
                                • Redacción curricular y carga de versiones digitales de capítulos.<br>
                                • Inspección de diferencias visuales estilo Git (Diff) de versiones subsanadas.<br>
                                • Carga y registro en el Repositorio de Evidencias Normativas.<br>
                                • Registro y resolución de observaciones técnicas.<br>
                                • Consulta interactiva del grafo de dependencias y plan de estudios.
                            </td>
                            <td>
                                Restringido de crear usuarios, emitir convocatorias formales y consultar la bitácora general de auditoría.
                            </td>
                        </tr>
                        <tr class="{{ $rolActual === 'invitado' ? 'active-role' : '' }}">
                            <td>
                                <strong>Invitado</strong>
                                @if($rolActual === 'invitado')
                                    <span class="badge-active">SU ROL</span>
                                @endif
                            </td>
                            <td>
                                • Visualización de la malla curricular y árbol de materias.<br>
                                • Navegación interactiva en el grafo de prerrequisitos.<br>
                                • Lectura y descarga de capítulos y reportes curriculares aprobados.
                            </td>
                            <td>
                                Modo de solo lectura. No puede redactar, subir archivos ni alterar estados curriculares.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="footer">
            Este mensaje ha sido generado automáticamente por el Sistema de Rediseño Curricular FICCT.<br>
            Universidad Autónoma Gabriel René Moreno — Santa Cruz de la Sierra, Bolivia.<br>
            <em>Por favor no responda a este mensaje, la casilla de envío no es monitoreada.</em>
        </div>
    </div>
</body>
</html>
