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
