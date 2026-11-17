# Arquitectura del Proyecto: Seguimiento al Diseño Curricular

## Stack Tecnológico
- **Arquitectura:** 3 capas desacopladas (Monorepo: `backend/` y `frontend/`).
- **Backend:** PHP 8.x + Laravel (API RESTful).
- **Frontend:** React + Vite + TypeScript + Tailwind CSS.
- **Base de Datos:** PostgreSQL.
- **Visualización de Grafos:** React Flow (@xyflow/react).

## Decisiones de Arquitectura (ADR)

### ADR-001: Monorepo con Backend y Frontend Desacoplados
- **Decisión:** Organizar el repositorio en dos directorios independientes (`backend/` para Laravel y `frontend/` para React SPA).
- **Motivo:** Cumplir con la arquitectura de API RESTful, permitiendo despliegues y pruebas independientes manteniendo un único control de versiones.
- **Fecha:** 2026-11-04
- **Estado:** vigente

### ADR-002: Base de Datos Relacional PostgreSQL
- **Decisión:** Emplear PostgreSQL como motor de base de datos principal.
- **Motivo:** Soporte robusto para consultas recursivas (CTE para grafos de prerrequisitos), integridad referencial estricta y auditoría inmutable.
- **Fecha:** 2026-11-04
- **Estado:** vigente

### ADR-003: Frontend con React, TypeScript y Tailwind CSS
- **Decisión:** Implementar la SPA con React, TypeScript y Tailwind CSS mediante variables semánticas.
- **Motivo:** TypeScript garantiza contratos de datos fiables para la máquina de estados y el grafo. Tailwind con variables CSS facilita el soporte multi-tema (niños, jóvenes, adultos), modo día/noche y accesibilidad exigidos.
- **Fecha:** 2026-11-04
- **Estado:** vigente

### ADR-004: Exclusión del Módulo de Pagos Electrónicos
- **Decisión:** Omitir la implementación del módulo de pagos electrónicos (Requisito general 10).
- **Motivo:** El proyecto está orientado a la gestión académica interna de una carrera universitaria sin fines de lucro, alineado al alcance formalmente aprobado en los Casos de Uso (CU1 a CU8) por el docente.
- **Fecha:** 2026-11-04
- **Estado:** vigente

### ADR-005: Blindaje RBAC Híbrido y Mitigación de Fuerza Bruta
- **Decisión:** Implementar Rate Limiting estricto por combinación `usuario|IP` en el backend (bloqueo temporal de 5 minutos tras 5 fallos consecutivos con código HTTP 429) y registro de auditoría inmutable (`bloqueo_fuerza_bruta`). En el frontend, las rutas administrativas no autorizadas despliegan una pantalla `403 - Acceso Denegado` con temporizador en vivo de 3 segundos y redirección automática hacia el Dashboard.
- **Motivo:** Evitar vulnerabilidades de enumeración y ataques de fuerza bruta en el inicio de sesión, y garantizar que la navegación directa por URL respete la matriz de control de accesos basada en roles (RBAC).
- **Fecha:** 2026-11-17
- **Estado:** vigente

### ADR-006: Recuperación Administrativa de Contraseñas y Cambio Obligatorio en Primer Ingreso
- **Decisión:** Delegar exclusivamente al rol Director la facultad de restablecer contraseñas mediante clave temporal institucional (`POST /api/usuarios/{id}/reset-password`), marcando la bandera persistente `debe_cambiar_password = true` y levantando bloqueos previos. En la SPA, si un usuario ingresa con una clave temporal, se despliega un modal bloqueante que exige definir una contraseña personal definitiva (`POST /api/auth/cambiar-password-obligatorio`) antes de permitir el acceso al sistema.
- **Motivo:** Eliminar dependencias de servidores SMTP externos que fallarían en entornos de evaluación local, ajustándose al modelo institucional de la UAGRM donde las cuentas docentes son centralizadas por la Dirección de Carrera.
- **Fecha:** 2026-11-17
- **Estado:** vigente

### ADR-007: Control de Versiones Documentales y Comparador Visual Git-Style
- **Decisión:** Implementar versionado incremental de documentos de redacción (`version_capitulo`) con extracción de texto digital en el cliente (`pdfjs-dist`), persistencia en PostgreSQL y cálculo de diferencias en memoria mediante el algoritmo LCS (*Longest Common Subsequence*) en la SPA, con soporte para lectura de todos los roles y vista a pantalla completa.
- **Motivo:** Brindar a los comités evaluadores, directores y delegados evidencia visual inmediata (estilo Git) de los cambios efectuados entre el documento observado y el corregido, sin depender de microservicios externos ni alterar la inmutabilidad de los PDFs binarios.
- **Fecha:** 2026-11-17
- **Estado:** vigente

