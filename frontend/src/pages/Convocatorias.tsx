import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getActivePlanId } from '../services/activePlan';
import type { 
  ConvocatoriaReunion, 
  UsuarioBackend, 
  Componente, 
  Capitulo 
} from '../types';
import { 
  CalendarCheck, Mail, Send, FileText, CheckCircle2, 
  AlertTriangle, Clock, MapPin, Video, Users, UserX, 
  Download, ExternalLink, Plus, Trash2, Tag, RefreshCw, 
  ChevronRight, Calendar, AlertCircle, ShieldAlert,
  Eye, X
} from 'lucide-react';

export const Convocatorias: React.FC = () => {
  const { user: currentUser } = useAuth();

  // Estado de pestañas
  const [activeTab, setActiveTab] = useState<'emitir' | 'historial'>('emitir');

  // Estados del formulario de emisión
  const [titulo, setTitulo] = useState('Reunión Ordinaria de Socialización del Avance del Rediseño Curricular 2026');
  const [fechaReunion, setFechaReunion] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [horaReunion, setHoraReunion] = useState('16:00');
  const [lugar, setLugar] = useState('Sala de Consejo Directivo FICCT - Módulo 236');
  const [modalidad, setModalidad] = useState<'presencial' | 'virtual' | 'hibrida'>('presencial');
  const [enlaceVirtual, setEnlaceVirtual] = useState('');

  // Orden del día (dinámico)
  const [ordenDelDia, setOrdenDelDia] = useState<Array<{ punto: string; enlace: string }>>([
    { punto: 'Apertura de sesión y verificación de quórum reglamentario', enlace: '' },
    { punto: 'Socialización y revisión integral de la Malla Curricular Plan 2026', enlace: '/malla' },
    { punto: 'Evaluación del avance de capítulos de redacción técnica', enlace: '/capitulos' },
    { punto: 'Subsanación de observaciones formuladas por el Comité Evaluador', enlace: '/observaciones' },
  ]);
  const [nuevoPuntoTexto, setNuevoPuntoTexto] = useState('');
  const [nuevoPuntoEnlace, setNuevoPuntoEnlace] = useState('');

  // Capítulos para selector rápido
  const [capitulosDisponibles, setCapitulosDisponibles] = useState<Capitulo[]>([]);

  // Usuarios de la comisión
  const [usuariosComision, setUsuariosComision] = useState<UsuarioBackend[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);

  // Estados de envío y modal de exclusiones
  const [submitting, setSubmitting] = useState(false);
  const [showExclusionModal, setShowExclusionModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState<{
    mensaje: string;
    codigo: string;
    pdfUrl?: string;
  } | null>(null);

  // Historial de convocatorias
  const [historial, setHistorial] = useState<ConvocatoriaReunion[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [selectedConvocatoriaDetalle, setSelectedConvocatoriaDetalle] = useState<ConvocatoriaReunion | null>(null);

  // Estados para el Modal de Previsualización PDF
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');

  // Carga inicial de usuarios y capítulos
  useEffect(() => {
    cargarUsuariosYCapitulos();
    cargarHistorial();
  }, []);

  const cargarUsuariosYCapitulos = async () => {
    setLoadingUsuarios(true);
    try {
      // 1. Cargar usuarios activos de la comisión
      const resUsers = await api.get('/usuarios');
      if (resUsers.data.success) {
        const todos: UsuarioBackend[] = resUsers.data.usuarios || [];
        // Filtrar activos excluyendo al director que convoca
        const miembros = todos.filter(u => u.activo && u.id !== currentUser?.id);
        setUsuariosComision(miembros);
        // Selección por defecto: TODOS los miembros marcados
        setSelectedUserIds(new Set(miembros.map(u => u.id)));
      }

      // 2. Cargar capítulos del plan activo para el selector del orden del día
      const planId = getActivePlanId();
      const resComp = await api.get(`/planes/${planId}/componentes`);
      if (resComp.data.success) {
        const comps: Componente[] = resComp.data.componentes || [];
        const caps: Capitulo[] = [];
        comps.forEach(c => {
          if (c.capitulos) {
            caps.push(...c.capitulos);
          }
        });
        setCapitulosDisponibles(caps);
      }
    } catch (err) {
      console.error('Error cargando datos para convocatorias:', err);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const cargarHistorial = async () => {
    setLoadingHistorial(true);
    try {
      const res = await api.get('/convocatorias');
      if (res.data.success) {
        const lista = res.data.convocatorias?.data || res.data.convocatorias || [];
        setHistorial(lista);
      }
    } catch (err) {
      console.error('Error al cargar historial de convocatorias:', err);
    } finally {
      setLoadingHistorial(false);
    }
  };

  // Manejo de checkboxes híbridos
  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(new Set(usuariosComision.map(u => u.id)));
    } else {
      setSelectedUserIds(new Set());
    }
  };

  const toggleUsuario = (id: number) => {
    const nuevo = new Set(selectedUserIds);
    if (nuevo.has(id)) {
      nuevo.delete(id);
    } else {
      nuevo.add(id);
    }
    setSelectedUserIds(nuevo);
  };

  const isAllSelected = usuariosComision.length > 0 && selectedUserIds.size === usuariosComision.length;
  const excluidosCount = Math.max(0, usuariosComision.length - selectedUserIds.size);
  const usuariosExcluidos = usuariosComision.filter(u => !selectedUserIds.has(u.id));

  // Manejo de la agenda dinámica
  const agregarPuntoManual = () => {
    if (!nuevoPuntoTexto.trim()) return;
    setOrdenDelDia([
      ...ordenDelDia,
      { punto: nuevoPuntoTexto.trim(), enlace: nuevoPuntoEnlace.trim() }
    ]);
    setNuevoPuntoTexto('');
    setNuevoPuntoEnlace('');
  };

  const agregarPuntoPredefinido = (texto: string, enlace: string) => {
    if (ordenDelDia.some(item => item.punto === texto)) return;
    setOrdenDelDia([...ordenDelDia, { punto: texto, enlace }]);
  };

  const agregarCapituloALaAgenda = (capituloId: string) => {
    if (!capituloId) return;
    const cap = capitulosDisponibles.find(c => c.id === Number(capituloId));
    if (!cap) return;
    const texto = `Revisión y Dictamen del Capítulo ${cap.numero}: ${cap.titulo}`;
    const enlace = `/capitulos/${cap.id}`;
    if (!ordenDelDia.some(item => item.punto === texto)) {
      setOrdenDelDia([...ordenDelDia, { punto: texto, enlace }]);
    }
  };

  const eliminarPuntoAgenda = (index: number) => {
    setOrdenDelDia(ordenDelDia.filter((_, i) => i !== index));
  };

  // Validación y preparación del despacho
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!titulo.trim()) {
      setFormError('Por favor ingresa el título formal de la convocatoria.');
      return;
    }
    if (!fechaReunion) {
      setFormError('Por favor selecciona la fecha programada para la reunión.');
      return;
    }
    if (!horaReunion) {
      setFormError('Por favor define la hora de la sesión.');
      return;
    }
    if (!lugar.trim()) {
      setFormError('Por favor ingresa la sala o dirección de la sesión.');
      return;
    }
    if (modalidad !== 'presencial' && !enlaceVirtual.trim()) {
      setFormError('Para reuniones virtuales o híbridas debes proporcionar el enlace de videoconferencia (ej. Meet).');
      return;
    }
    if (ordenDelDia.length === 0) {
      setFormError('Debes agregar al menos un punto o tema en el orden del día.');
      return;
    }
    if (selectedUserIds.size === 0) {
      setFormError('Debes convocar al menos a un miembro de la comisión.');
      return;
    }

    // Si hay miembros desmarcados, activar modal bloqueante de advertencia
    if (excluidosCount > 0) {
      setShowExclusionModal(true);
      return;
    }

    // Si todos están seleccionados, despachar inmediatamente
    procederConDespacho();
  };

  const procederConDespacho = async () => {
    setShowExclusionModal(false);
    setSubmitting(true);
    setFormError('');

    try {
      const payload = {
        titulo: titulo.trim(),
        fecha_reunion: fechaReunion,
        hora_reunion: horaReunion,
        lugar: lugar.trim(),
        modalidad,
        enlace_virtual: enlaceVirtual.trim() || null,
        orden_del_dia: ordenDelDia,
        usuarios_ids: Array.from(selectedUserIds),
      };

      const res = await api.post('/convocatorias', payload);

      if (res.data.success) {
        setFormSuccess({
          mensaje: res.data.message,
          codigo: res.data.codigo_convocatoria,
          pdfUrl: res.data.pdf_url,
        });
        // Refrescar historial en segundo plano
        cargarHistorial();
      }
    } catch (err: any) {
      console.error('Error al emitir convocatoria:', err);
      const serverMsg = err.response?.data?.message || 'Error al emitir la convocatoria y despachar los correos.';
      setFormError(serverMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const descargarPdfDirecto = (id: number) => {
    window.open(`/api/convocatorias/${id}/pdf`, '_blank');
  };

  const handlePrevisualizarBorrador = async () => {
    if (!titulo.trim()) {
      setFormError('Por favor ingresa un título antes de previsualizar la carta.');
      return;
    }
    if (ordenDelDia.length === 0) {
      setFormError('Por favor agrega al menos un punto en el orden del día antes de previsualizar.');
      return;
    }

    setPreviewLoading(true);
    setFormError('');

    try {
      const payload = {
        titulo: titulo.trim(),
        fecha_reunion: fechaReunion,
        hora_reunion: horaReunion,
        lugar: lugar.trim(),
        modalidad,
        enlace_virtual: enlaceVirtual.trim() || null,
        orden_del_dia: ordenDelDia,
        usuarios_ids: Array.from(selectedUserIds),
      };

      const res = await api.post('/convocatorias/previsualizar', payload, {
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPreviewPdfUrl(url);
      setPreviewTitle(`Borrador: ${titulo}`);
      setPreviewModalOpen(true);
    } catch (err: any) {
      console.error('Error al previsualizar borrador de convocatoria:', err);
      setFormError('No se pudo generar la vista previa del PDF.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePrevisualizarHistorial = async (conv: ConvocatoriaReunion) => {
    setPreviewLoading(true);
    try {
      const res = await api.get(`/convocatorias/${conv.id}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPreviewPdfUrl(url);
      setPreviewTitle(`${conv.codigo_convocatoria}: ${conv.titulo}`);
      setPreviewModalOpen(true);
    } catch (err: any) {
      console.error('Error al cargar PDF histórico:', err);
      window.open(`/api/convocatorias/${conv.id}/pdf`, '_blank');
    } finally {
      setPreviewLoading(false);
    }
  };

  const cerrarModalPrevisualizacion = () => {
    if (previewPdfUrl && previewPdfUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewPdfUrl);
    }
    setPreviewPdfUrl(null);
    setPreviewModalOpen(false);
  };

  const generarGoogleCalendarUrl = (conv: ConvocatoriaReunion) => {
    try {
      const dtStart = conv.fecha_reunion.replace(/-/g, '') + 'T' + conv.hora_reunion.replace(':', '') + '00';
      const [h, m] = conv.hora_reunion.split(':').map(Number);
      const endHour = String((h + 2) % 24).padStart(2, '0');
      const dtEnd = conv.fecha_reunion.replace(/-/g, '') + 'T' + endHour + String(m).padStart(2, '0') + '00';

      const agendaTexto = (conv.orden_del_dia || [])
        .map((item, i) => `${i + 1}. ${typeof item === 'string' ? item : item.punto}`)
        .join('\n');

      const details = encodeURIComponent(
        `CONVOCATORIA OFICIAL UAGRM FICCT (${conv.codigo_convocatoria})\n` +
        `Comisión de Rediseño Curricular\n\n` +
        `ORDEN DEL DÍA:\n${agendaTexto}\n\n` +
        (conv.enlace_virtual ? `Enlace de Videoconferencia: ${conv.enlace_virtual}\n` : '') +
        `Lugar: ${conv.lugar}`
      );

      const title = encodeURIComponent(`[FICCT] ${conv.titulo} (${conv.codigo_convocatoria})`);
      const location = encodeURIComponent(conv.lugar + (conv.enlace_virtual ? ` | ${conv.enlace_virtual}` : ''));

      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dtStart}/${dtEnd}&details=${details}&location=${location}`;
    } catch {
      return '#';
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div 
        className="p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <CalendarCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Convocatorias Oficiales y Reuniones de Comisión
            </h1>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Emisión de cartas de convocatoria formal en PDF con firma institucional, agenda interactiva y despacho vía correo electrónico oficial con calendario.
            </p>
          </div>
        </div>

        {/* Selector de Pestañas */}
        <div className="flex items-center gap-2 p-1 rounded-xl border self-start md:self-auto"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}>
          <button
            type="button"
            onClick={() => { setActiveTab('emitir'); setFormSuccess(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'emitir' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
            }`}
            style={activeTab === 'emitir' ? { backgroundColor: 'var(--primary)', color: 'var(--primary-text)' } : {}}
          >
            <Send className="w-3.5 h-3.5" />
            Emitir Convocatoria
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('historial')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'historial' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
            }`}
            style={activeTab === 'historial' ? { backgroundColor: 'var(--primary)', color: 'var(--primary-text)' } : {}}
          >
            <Clock className="w-3.5 h-3.5" />
            Historial ({historial.length})
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* PESTAÑA 1: FORMULARIO DE EMISIÓN DE CONVOCATORIA         */}
      {/* ======================================================== */}
      {activeTab === 'emitir' && (
        <div className="space-y-6">
          {/* Alerta de Éxito al Enviar */}
          {formSuccess && (
            <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                <div>
                  <div className="font-bold text-sm">{formSuccess.mensaje}</div>
                  <div className="text-xs opacity-80 mt-0.5">
                    Código oficial asignado: <span className="font-mono font-bold">{formSuccess.codigo}</span>. Todos los miembros convocados han recibido su notificación.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('historial')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-emerald-600/30 bg-emerald-600/20 hover:bg-emerald-600/30 transition"
                >
                  Ver en Historial
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormSuccess(null);
                    setTitulo('Reunión Extraordinaria de Socialización del Rediseño Curricular 2026');
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition"
                >
                  Nueva Convocatoria
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handlePreSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Columna Izquierda / Central: Parámetros y Orden del Día (2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Datos Principales de la Sesión */}
                <div 
                  className="p-6 rounded-2xl border shadow-sm space-y-4"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                >
                  <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-500" />
                    1. Parámetros de la Convocatoria
                  </h2>

                  <div>
                    <label className="block text-xs font-medium mb-1 opacity-80">
                      Título Oficial de la Sesión <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      placeholder="Ej. Reunión Ordinaria de Socialización del Avance..."
                      required
                      className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                      style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1 opacity-80 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Fecha de la Sesión <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={fechaReunion}
                        onChange={(e) => setFechaReunion(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                        style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1 opacity-80 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Hora de Inicio <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={horaReunion}
                        onChange={(e) => setHoraReunion(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                        style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1 opacity-80">
                        Modalidad <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={modalidad}
                        onChange={(e: any) => setModalidad(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                        style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                      >
                        <option value="presencial">Presencial (Sala de Reuniones)</option>
                        <option value="virtual">Virtual (Videoconferencia)</option>
                        <option value="hibrida">Híbrida (Presencial y Virtual)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1 opacity-80 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        Lugar / Sala Física <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={lugar}
                        onChange={(e) => setLugar(e.target.value)}
                        placeholder="Ej. Sala de Consejo FICCT - Módulo 236"
                        required
                        className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                        style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1 opacity-80 flex items-center gap-1">
                        <Video className="w-3.5 h-3.5" />
                        Enlace Videoconferencia {modalidad !== 'presencial' && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type="url"
                        value={enlaceVirtual}
                        onChange={(e) => setEnlaceVirtual(e.target.value)}
                        placeholder="https://meet.google.com/xyz-abcd-efg"
                        className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                        style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Constructor Dinámico del Orden del Día */}
                <div 
                  className="p-6 rounded-2xl border shadow-sm space-y-4"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                      <Tag className="w-4 h-4 text-amber-500" />
                      2. Orden del Día (Temas a Tratar)
                    </h2>
                    <span className="text-xs opacity-70">
                      {ordenDelDia.length} punto(s) agregados
                    </span>
                  </div>

                  {/* Atajos Rápidos */}
                  <div className="p-3 rounded-xl border text-xs space-y-2"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}>
                    <div className="font-semibold opacity-75 text-[11px] uppercase tracking-wider">
                      Agregar Temas Rápidos Predefinidos:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => agregarPuntoPredefinido('Revisión y Aprobación de la Malla Curricular Plan 2026', '/malla')}
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium border hover:bg-amber-500/10 hover:border-amber-500 transition flex items-center gap-1"
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        <Plus className="w-3 h-3 text-amber-500" />
                        Malla Curricular
                      </button>
                      <button
                        type="button"
                        onClick={() => agregarPuntoPredefinido('Validación del Grafo de Prerrequisitos y Seriación', '/grafo')}
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium border hover:bg-amber-500/10 hover:border-amber-500 transition flex items-center gap-1"
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        <Plus className="w-3 h-3 text-amber-500" />
                        Grafo Prerrequisitos
                      </button>
                      <button
                        type="button"
                        onClick={() => agregarPuntoPredefinido('Subsanación de Observaciones Técnicas del Comité', '/observaciones')}
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium border hover:bg-amber-500/10 hover:border-amber-500 transition flex items-center gap-1"
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        <Plus className="w-3 h-3 text-amber-500" />
                        Observaciones Comité
                      </button>
                      <button
                        type="button"
                        onClick={() => agregarPuntoPredefinido('Verificación de Documentos de Evidencia y Normativas', '/evidencias')}
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium border hover:bg-amber-500/10 hover:border-amber-500 transition flex items-center gap-1"
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        <Plus className="w-3 h-3 text-amber-500" />
                        Evidencias y Leyes
                      </button>
                    </div>

                    {/* Selector de Capítulo Específico */}
                    {capitulosDisponibles.length > 0 && (
                      <div className="pt-2 flex items-center gap-2">
                        <span className="text-[11px] opacity-70">O elegir un capítulo específico:</span>
                        <select
                          onChange={(e) => {
                            agregarCapituloALaAgenda(e.target.value);
                            e.target.value = '';
                          }}
                          defaultValue=""
                          className="px-2 py-1 rounded border text-xs flex-1 focus:outline-none"
                          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
                        >
                          <option value="" disabled>Seleccionar capítulo para revisión...</option>
                          {capitulosDisponibles.map(c => (
                            <option key={c.id} value={c.id}>
                              Cap. {c.numero}: {c.titulo}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Formulario de Entrada Manual de Punto */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={nuevoPuntoTexto}
                      onChange={(e) => setNuevoPuntoTexto(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          agregarPuntoManual();
                        }
                      }}
                      placeholder="Escribir tema o punto a tratar en la reunión..."
                      className="flex-1 px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                      style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                    />
                    <input
                      type="text"
                      value={nuevoPuntoEnlace}
                      onChange={(e) => setNuevoPuntoEnlace(e.target.value)}
                      placeholder="Enlace opcional (ej. /malla)"
                      className="w-full sm:w-44 px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                      style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                    />
                    <button
                      type="button"
                      onClick={agregarPuntoManual}
                      className="px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5"
                      style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-text)' }}
                    >
                      <Plus className="w-4 h-4" />
                      Agregar
                    </button>
                  </div>

                  {/* Lista Enumerada del Orden del Día */}
                  <div className="space-y-2">
                    {ordenDelDia.map((item, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-3 rounded-xl border text-xs transition"
                        style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                      >
                        <div className="flex items-start gap-2.5 flex-1 pr-2">
                          <span className="font-bold text-amber-500 mt-0.5">{index + 1}.</span>
                          <div>
                            <div className="font-medium">{item.punto}</div>
                            {item.enlace && (
                              <div className="text-[11px] text-blue-500 hover:underline flex items-center gap-1 mt-0.5">
                                <ExternalLink className="w-3 h-3" />
                                {item.enlace}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarPuntoAgenda(index)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition"
                          title="Eliminar tema"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Columna Derecha: Selección Híbrida de Miembros de Comisión */}
              <div className="space-y-6">
                <div 
                  className="p-6 rounded-2xl border shadow-sm space-y-4"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-500" />
                      3. Convocatoria a Miembros
                    </h2>
                  </div>

                  {/* Master Checkbox (Solución Híbrida) */}
                  <div className="p-3.5 rounded-xl border bg-amber-500/5 border-amber-500/20 space-y-2">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-gray-300"
                      />
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        Seleccionar a todos los miembros (Recomendado)
                      </span>
                    </label>
                    <p className="text-[11px] opacity-75 pl-6">
                      Por defecto se convoca a la totalidad de los miembros activos de la comisión para garantizar quórum y validez institucional.
                    </p>
                  </div>

                  {/* Indicador de Exclusiones */}
                  {excluidosCount > 0 ? (
                    <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                      <UserX className="w-4 h-4 flex-shrink-0" />
                      <div>
                        <strong>{excluidosCount} miembro(s) desmarcado(s).</strong> Se requerirá confirmación explícita para registrar la exclusión en auditoría.
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>Comisión completa seleccionada ({usuariosComision.length} docentes).</span>
                    </div>
                  )}

                  {/* Listado con checkboxes individuales */}
                  <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
                    {loadingUsuarios ? (
                      <div className="text-center py-6 text-xs opacity-60">Cargando docentes...</div>
                    ) : usuariosComision.length === 0 ? (
                      <div className="text-center py-6 text-xs opacity-60">No se encontraron docentes activos.</div>
                    ) : (
                      usuariosComision.map((u) => {
                        const isChecked = selectedUserIds.has(u.id);
                        return (
                          <div
                            key={u.id}
                            onClick={() => toggleUsuario(u.id)}
                            className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                              isChecked 
                                ? 'border-amber-500/40 bg-amber-500/5' 
                                : 'opacity-60 border-slate-300 dark:border-slate-700 hover:opacity-90'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}} // Manejado por onClick del contenedor
                                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-gray-300"
                              />
                              <div>
                                <div className="font-semibold text-xs leading-tight">
                                  {u.nombre_completo}
                                </div>
                                <div className="text-[11px] opacity-70 flex items-center gap-1 mt-0.5">
                                  <Mail className="w-3 h-3" />
                                  {u.email}
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-current opacity-80">
                              {u.rol?.nombre || 'Docente'}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Botón de Previsualización y Emisión */}
                  {formError && (
                    <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <div>{formError}</div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handlePrevisualizarBorrador}
                    disabled={submitting || previewLoading || ordenDelDia.length === 0}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold border shadow-sm hover:bg-slate-500/10 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    {previewLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                        Compilando Vista Previa...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 text-amber-500" />
                        Previsualizar Carta Oficial (PDF)
                      </>
                    )}
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || selectedUserIds.size === 0}
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-text)' }}
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generando Carta PDF y Despachando Correos...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Emitir Convocatoria Oficial ({selectedUserIds.size} destinatarios)
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-center opacity-60">
                    Se generará el archivo PDF institucional, evento .ics y se registrará en la Bitácora de Auditoría.
                  </p>
                </div>
              </div>

            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 2: HISTORIAL DE CONVOCATORIAS EMITIDAS           */}
      {/* ======================================================== */}
      {activeTab === 'historial' && (
        <div className="space-y-6">
          <div 
            className="p-6 rounded-2xl border shadow-sm space-y-4"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Registro Histórico de Convocatorias Emitidas
                </h2>
                <p className="text-xs opacity-70 mt-1">
                  Listado cronológico de cartas de convocatoria generadas, trazabilidad de docentes convocados y enlace de descarga de actas.
                </p>
              </div>
              <button
                type="button"
                onClick={cargarHistorial}
                className="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center gap-1.5"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Actualizar
              </button>
            </div>

            {loadingHistorial ? (
              <div className="text-center py-12 text-sm opacity-60">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                Cargando historial de convocatorias...
              </div>
            ) : historial.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-xl opacity-60 text-xs">
                No se han emitido convocatorias todavía.
              </div>
            ) : (
              <div className="space-y-4">
                {historial.map((conv) => {
                  const googleCalUrl = generarGoogleCalendarUrl(conv);
                  return (
                    <div 
                      key={conv.id}
                      className="p-5 rounded-2xl border transition shadow-sm space-y-4"
                      style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                    >
                      {/* Cabecera de la Convocatoria */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            {conv.codigo_convocatoria}
                          </span>
                          <h3 className="font-bold text-sm">
                            {conv.titulo}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePrevisualizarHistorial(conv)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Previsualizar PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => descargarPdfDirecto(conv.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/20 transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Descargar Carta PDF
                          </button>
                          <a
                            href={googleCalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20 transition"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            Google Calendar
                          </a>
                        </div>
                      </div>

                      {/* Metadatos y Coordenadas */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1">
                        <div className="p-2.5 rounded-xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
                          <span className="opacity-60 block text-[10px] uppercase font-semibold">Fecha y Hora</span>
                          <span className="font-bold">{conv.fecha_reunion} • {conv.hora_reunion} hrs.</span>
                        </div>
                        <div className="p-2.5 rounded-xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
                          <span className="opacity-60 block text-[10px] uppercase font-semibold">Modalidad y Lugar</span>
                          <span className="font-bold capitalize">{conv.modalidad}</span>
                          <div className="text-[11px] opacity-70 truncate">{conv.lugar}</div>
                        </div>
                        <div className="p-2.5 rounded-xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
                          <span className="opacity-60 block text-[10px] uppercase font-semibold">Convocados</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {conv.total_convocados} docentes
                          </span>
                          {conv.total_excluidos > 0 && (
                            <span className="text-[11px] text-rose-500 font-semibold ml-2">
                              ({conv.total_excluidos} excluidos)
                            </span>
                          )}
                        </div>
                        <div className="p-2.5 rounded-xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
                          <span className="opacity-60 block text-[10px] uppercase font-semibold">Convocante</span>
                          <span className="font-bold truncate block">{conv.convocador?.nombre_completo || 'Director de Carrera'}</span>
                        </div>
                      </div>

                      {/* Orden del Día Resumido */}
                      {conv.orden_del_dia && conv.orden_del_dia.length > 0 && (
                        <div className="pt-2 text-xs">
                          <span className="font-bold opacity-75 text-[11px] uppercase tracking-wider block mb-1">
                            Orden del Día:
                          </span>
                          <ol className="list-decimal pl-5 space-y-0.5 opacity-90">
                            {conv.orden_del_dia.map((item, idx) => (
                              <li key={idx}>
                                {typeof item === 'string' ? item : item.punto}
                                {typeof item !== 'string' && item.enlace && (
                                  <span className="text-blue-500 ml-1 font-mono text-[11px]">({item.enlace})</span>
                                )}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Botón para ver destinatarios expandidos */}
                      <div className="pt-2 flex items-center justify-between border-t" style={{ borderColor: 'var(--border-color)' }}>
                        <span className="text-[11px] opacity-60">
                          Emitida el {new Date(conv.created_at).toLocaleDateString()} a las {new Date(conv.created_at).toLocaleTimeString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedConvocatoriaDetalle(selectedConvocatoriaDetalle?.id === conv.id ? null : conv)}
                          className="text-xs font-semibold text-amber-500 hover:underline flex items-center gap-1"
                        >
                          {selectedConvocatoriaDetalle?.id === conv.id ? 'Ocultar Destinatarios' : `Ver Lista de ${conv.destinatarios?.length || conv.total_convocados} Destinatarios`}
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${selectedConvocatoriaDetalle?.id === conv.id ? 'rotate-90' : ''}`} />
                        </button>
                      </div>

                      {/* Destinatarios Expandidos */}
                      {selectedConvocatoriaDetalle?.id === conv.id && (
                        <div className="mt-3 p-4 rounded-xl border bg-slate-500/5 space-y-2 text-xs">
                          <div className="font-bold text-[11px] uppercase tracking-wider opacity-80">
                            Estado de Despacho de Correo por Docente:
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {conv.destinatarios?.map(dest => (
                              <div key={dest.id} className="p-2.5 rounded-lg border bg-white/50 dark:bg-black/20 flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-xs">
                                    {dest.usuario?.nombre_completo || 'Docente'}
                                  </div>
                                  <div className="text-[10px] opacity-70">
                                    {dest.email_destinatario}
                                  </div>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                  dest.estado_envio === 'enviado' 
                                    ? 'bg-emerald-500/20 text-emerald-600' 
                                    : 'bg-amber-500/20 text-amber-600'
                                }`}>
                                  {dest.estado_envio === 'enviado' ? 'Despachado' : 'Contingencia'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL BLOQUEANTE DE ADVERTENCIA POR EXCLUSIÓN            */}
      {/* ======================================================== */}
      {showExclusionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div 
            className="w-full max-w-lg p-6 rounded-2xl border shadow-2xl space-y-5 animate-in zoom-in-95"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-3 rounded-full bg-rose-500/10">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">
                  Confirmación de Emisión con Exclusiones
                </h3>
                <p className="text-xs opacity-75">
                  Atención: No estás convocando a toda la comisión.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 text-xs space-y-2">
              <p className="font-medium">
                Has desmarcado a <strong>{excluidosCount} miembro(s)</strong> de la comisión de rediseño curricular:
              </p>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pl-2 border-l-2 border-rose-500/40">
                {usuariosExcluidos.map(u => (
                  <div key={u.id} className="text-[11px]">
                    • <span className="font-semibold">{u.nombre_completo}</span> ({u.rol?.nombre}) — <span className="opacity-70">{u.email}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-800 dark:text-amber-200">
              <strong>Nota de Auditoría Inmutable:</strong> Esta exclusión quedará registrada formalmente en la bitácora de auditoría del sistema (<span className="font-mono">convocatoria_reunion_enviada</span>) especificando la cantidad de excluidos para fines de transparencia institucional.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowExclusionModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border hover:bg-black/5 dark:hover:bg-white/5 transition"
                style={{ borderColor: 'var(--border-color)' }}
              >
                Volver y Revisar
              </button>
              <button
                type="button"
                onClick={procederConDespacho}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-md transition flex items-center gap-1.5"
              >
                <AlertTriangle className="w-4 h-4" />
                Sí, Confirmar Emisión con Exclusiones
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DE PREVISUALIZACIÓN DE CARTA OFICIAL PDF           */}
      {/* ======================================================== */}
      {previewModalOpen && previewPdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div 
            className="w-full max-w-5xl h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden animate-in zoom-in-95"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight truncate max-w-md sm:max-w-xl">
                    {previewTitle}
                  </h3>
                  <p className="text-[11px] opacity-70">
                    Formato oficial con membrete UAGRM/FICCT, correlativo y orden del día.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir Pestaña
                </a>
                <a
                  href={previewPdfUrl}
                  download="Carta_Convocatoria.pdf"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/20 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar
                </a>
                <button
                  type="button"
                  onClick={cerrarModalPrevisualizacion}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition ml-1"
                  title="Cerrar visor"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Visor PDF Embebido */}
            <div className="flex-1 p-3 bg-slate-900/10 dark:bg-black/40 overflow-hidden">
              <iframe
                src={previewPdfUrl}
                className="w-full h-full rounded-xl border border-slate-300 dark:border-slate-800 shadow-inner bg-white"
                title="Visor de Carta Oficial de Convocatoria"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
