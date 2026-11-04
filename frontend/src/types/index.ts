export interface User {
  id: number;
  nombreCompleto: string;
  nombre_completo?: string;
  email: string;
  username: string;
  fotoRuta?: string;
  foto_ruta?: string;
  rol: string;
  idRol: number;
}

export interface MenuItem {
  id: number;
  titulo: string;
  ruta: string;
  icono?: string;
  orden: number;
  id_padre?: number | null;
  hijos?: MenuItem[];
}

export interface PlanEstudio {
  id: number;
  codigo: string;
  carrera: string;
  anio_vigencia: number;
  descripcion?: string;
  objetivos: string;
  perfil_egreso: string;
  limite_creditos_min: number;
  limite_creditos_max: number;
  estado: string;
  asignaturas_count?: number;
}

export interface Asignatura {
  id: number;
  sigla: string;
  nombre: string;
  semestre: number;
  horas_teoricas: number;
  horas_practicas: number;
  creditos: number;
  area_formativa: string;
  id_plan_estudio: number;
  prerrequisitos?: Asignatura[];
  materias_dependientes?: Asignatura[];
}

export interface Componente {
  id: number;
  numero: number;
  nombre: string;
  descripcion?: string;
  id_plan_estudio: number;
  capitulos?: Capitulo[];
}

export interface EstadoCapitulo {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface Capitulo {
  id: number;
  numero: number;
  titulo: string;
  contenido?: string;
  id_componente: number;
  id_estado: number;
  componente?: Componente;
  estado?: EstadoCapitulo;
  redactores?: User[];
  observaciones?: Observacion[];
  evidencias?: DocumentoEvidencia[];
  historial?: HistorialModificacion[];
}

export interface Observacion {
  id: number;
  comentario: string;
  respuesta_delegado?: string;
  fecha_respuesta?: string;
  resuelta: boolean;
  fecha_cierre?: string;
  id_capitulo: number;
  id_usuario_observador: number;
  id_usuario_respuesta?: number;
  observador?: { id: number; nombre_completo: string };
  redactor_respuesta?: { id: number; nombre_completo: string };
  created_at: string;
}

export interface HistorialModificacion {
  id: number;
  estado_anterior: string;
  estado_nuevo: string;
  descripcion_accion: string;
  justificacion_tecnica: string;
  fecha_hora: string;
  id_capitulo: number;
  id_usuario: number;
  usuario?: { id: number; nombre_completo: string; username: string };
}

export interface DocumentoEvidencia {
  id: number;
  codigo_norma: string;
  titulo: string;
  tipo_documento: string;
  organo_emisor: string;
  fecha_emision: string;
  archivo_ruta: string;
  vigente: boolean;
  id_documento_padre?: number | null;
  documento_padre?: DocumentoEvidencia;
}

export interface SearchResults {
  asignaturas: Array<{ id: number; sigla: string; nombre: string; semestre: number; creditos: number }>;
  capitulos: Array<{ id: number; numero: number; titulo: string; componente?: { nombre: string }; estado?: { nombre: string } }>;
  evidencias: Array<{ id: number; codigo_norma: string; titulo: string; tipo_documento: string; organo_emisor: string }>;
  planes: Array<{ id: number; codigo: string; carrera: string; anio_vigencia: number; estado: string }>;
}

export interface Rol {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface UsuarioBackend {
  id: number;
  nombre_completo: string;
  email: string;
  username: string;
  foto_ruta?: string;
  activo: boolean;
  id_rol: number;
  rol?: Rol;
  created_at?: string;
}

export interface BitacoraEntry {
  id: number;
  ip_address: string;
  user_agent: string;
  tipo_evento: string;
  ruta_recurso: string;
  metodo_http: string;
  descripcion?: string;
  fecha_hora: string;
  id_usuario?: number | null;
  usuario?: {
    id: number;
    nombre_completo: string;
    username: string;
    email: string;
  } | null;
}

export interface RecursoMasAccedido {
  ruta_recurso: string;
  total_accesos: number;
}

export interface EstadisticasLogins {
  exitosos: number;
  fallidos: number;
  total: number;
  efectividad_pct: number;
}

export interface ComponenteStat {
  id: number;
  numero: number;
  nombre: string;
  totalCapitulos: number;
  aprobados: number;
  observados: number;
  porcentajeCumplimiento: number;
}

export interface ProductividadUsuario {
  id: number;
  nombre: string;
  username: string;
  rol: string;
  capitulosAsignados: number;
  observacionesEmitidas: number;
  observacionesSubsanadas: number;
}

export interface ReporteFinalPayload {
  plan: PlanEstudio & {
    asignaturas: Array<Asignatura & { prerrequisitos?: Array<{ id: number; sigla: string; nombre: string }> }>;
    componentes: Array<Componente & {
      capitulos?: Array<Capitulo & {
        evidencias?: DocumentoEvidencia[];
        redactores?: Array<{ id: number; nombre_completo: string }>;
      }>;
    }>;
  };
  totalAsignaturas: number;
  totalCreditos: number;
  evidenciasVigentes: DocumentoEvidencia[];
  fechaCompilacion: string;
}


