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
  Eye, X, ArrowLeft, ArrowRight
} from 'lucide-react';

export const Convocatorias: React.FC = () => {
  const { user: currentUser } = useAuth();

  // Estado de pestañas
  const [activeTab, setActiveTab] = useState<'emitir' | 'historial'>('emitir');

  // Estado del Stepper (Paso 1, 2 o 3)
  const [step, setStep] = useState<1 | 2 | 3>(1);

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

  // Validaciones por paso del Stepper
  const validarPaso1 = (): boolean => {
    if (!titulo.trim()) {
      setFormError('Por favor ingresa el título formal de la convocatoria.');
      return false;
    }
    if (!fechaReunion) {
      setFormError('Por favor selecciona la fecha programada para la reunión.');
      return false;
    }
    if (!horaReunion) {
      setFormError('Por favor define la hora de la sesión.');
      return false;
    }
    if (!lugar.trim()) {
      setFormError('Por favor ingresa la sala o dirección de la sesión.');
      return false;
    }
    if (modalidad !== 'presencial' && !enlaceVirtual.trim()) {
      setFormError('Para reuniones virtuales o híbridas debes proporcionar el enlace de videoconferencia (ej. Meet).');
      return false;
    }
    setFormError('');
    return true;
  };

  const validarPaso2 = (): boolean => {
    if (ordenDelDia.length === 0) {
      setFormError('Debes agregar al menos un punto o tema en el orden del día.');
      return false;
    }
    setFormError('');
    return true;
  };

  const irAlPaso = (nuevoPaso: 1 | 2 | 3) => {
    setFormError('');
    if (nuevoPaso === 1) {
      setStep(1);
      return;
    }
    if (nuevoPaso === 2) {
      if (validarPaso1()) setStep(2);
      return;
    }
    if (nuevoPaso === 3) {
      if (validarPaso1() && validarPaso2()) setStep(3);
      return;
    }
  };

  // Validación y preparación del despacho
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!validarPaso1()) {
      setStep(1);
      return;
    }
    if (!validarPaso2()) {
      setStep(2);
      return;
    }
    if (selectedUserIds.size === 0) {
      setFormError('Debes convocar al menos a un miembro de la comisión.');
      setStep(3);
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
    <div className="space-y-4">
      {/* Encabezado Principal */}
      <div 
        className="p-5 rounded-xl border shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
              Módulo 5 • Convocatorias Institucionales
            </span>
            <span className="text-xs text-slate-400 font-medium">Comisión de Rediseño Curricular</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-amber-500" />
            Convocatorias Oficiales y Reuniones de Comisión
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Emisión de cartas de convocatoria formal en PDF con firma institucional, agenda interactiva y despacho vía correo con calendario.
          </p>
        </div>

        {/* Selector de Pestañas */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg border self-start md:self-auto bg-slate-100 dark:bg-slate-800"
          style={{ borderColor: 'var(--border-color)' }}>
          <button
            type="button"
            onClick={() => { setActiveTab('emitir'); setFormSuccess(null); }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'emitir' 
                ? 'bg-sky-500 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Emitir Convocatoria
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('historial')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'historial' 
                ? 'bg-sky-500 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
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
                    setStep(1);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition"
                >
                  Nueva Convocatoria
                </button>
              </div>
            </div>
          )}

          {/* Stepper Header (3 Pasos Guiados) */}
          <div 
            className="p-4 rounded-xl border shadow-xs"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {/* Paso 1 */}
              <button
                type="button"
                onClick={() => irAlPaso(1)}
                className="flex items-center gap-2.5 text-xs font-bold transition cursor-pointer"
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold border transition ${
                  step === 1 
                    ? 'bg-sky-500 text-white border-sky-500 shadow-xs' 
                    : step > 1 
                    ? 'bg-emerald-500 text-white border-emerald-500' 
                    : 'border-slate-300 dark:border-slate-700 text-slate-400'
                }`}>
                  {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
                </span>
                <div className="text-left hidden sm:block">
                  <div className={`text-[10px] uppercase tracking-wider ${step === 1 ? 'text-sistemas-cyan font-bold' : 'text-slate-400'}`}>Paso 1</div>
                  <div className={`text-xs ${step === 1 ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-600 dark:text-slate-300'}`}>Parámetros</div>
                </div>
              </button>

              <div className={`flex-1 h-0.5 mx-3 sm:mx-6 transition-colors ${step > 1 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`} />

              {/* Paso 2 */}
              <button
                type="button"
                onClick={() => irAlPaso(2)}
                className="flex items-center gap-2.5 text-xs font-bold transition cursor-pointer"
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold border transition ${
                  step === 2 
                    ? 'bg-sky-500 text-white border-sky-500 shadow-xs' 
                    : step > 2 
                    ? 'bg-emerald-500 text-white border-emerald-500' 
                    : 'border-slate-300 dark:border-slate-700 text-slate-400'
                }`}>
                  {step > 2 ? <CheckCircle2 className="w-4 h-4" /> : '2'}
                </span>
                <div className="text-left hidden sm:block">
                  <div className={`text-[10px] uppercase tracking-wider ${step === 2 ? 'text-sistemas-cyan font-bold' : 'text-slate-400'}`}>Paso 2</div>
                  <div className={`text-xs ${step === 2 ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-600 dark:text-slate-300'}`}>Orden del Día</div>
                </div>
              </button>

              <div className={`flex-1 h-0.5 mx-3 sm:mx-6 transition-colors ${step > 2 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`} />

              {/* Paso 3 */}
              <button
                type="button"
                onClick={() => irAlPaso(3)}
                className="flex items-center gap-2.5 text-xs font-bold transition cursor-pointer"
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold border transition ${
                  step === 3 
                    ? 'bg-sky-500 text-white border-sky-500 shadow-xs' 
                    : 'border-slate-300 dark:border-slate-700 text-slate-400'
                }`}>
                  3
                </span>
                <div className="text-left hidden sm:block">
                  <div className={`text-[10px] uppercase tracking-wider ${step === 3 ? 'text-sistemas-cyan font-bold' : 'text-slate-400'}`}>Paso 3</div>
                  <div className={`text-xs ${step === 3 ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-600 dark:text-slate-300'}`}>Miembros y Quórum</div>
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={handlePreSubmit} className="space-y-4">
            {/* Alerta de Error si ocurre */}
            {formError && (
              <div className="p-3.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <div className="font-medium">{formError}</div>
              </div>
            )}

            {/* ======================================================== */}
            {/* PASO 1: PARÁMETROS GENERALES DE LA SESIÓN               */}
            {/* ======================================================== */}
            {step === 1 && (
              <div className="space-y-4">
                <div 
                  className="p-5 rounded-xl border shadow-xs space-y-4"
                  style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
                >
                  <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <FileText className="w-4 h-4 text-sistemas-cyan" />
                      1. Parámetros Principales de la Convocatoria
                    </h2>
                    <span className="text-[11px] font-mono text-slate-400">Paso 1 de 3</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Título Oficial de la Sesión <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      placeholder="Ej. Reunión Ordinaria de Socialización del Avance..."
                      required
                      className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 transition font-medium"
                      style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Fecha de la Sesión <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={fechaReunion}
                        onChange={(e) => setFechaReunion(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                        style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Hora de Inicio <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={horaReunion}
                        onChange={(e) => setHoraReunion(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                        style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Modalidad <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={modalidad}
                        onChange={(e: any) => setModalidad(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 transition font-medium"
                        style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                      >
                        <option value="presencial">Presencial (Sala de Reuniones)</option>
                        <option value="virtual">Virtual (Videoconferencia)</option>
                        <option value="hibrida">Híbrida (Presencial y Virtual)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        Lugar / Sala Física <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={lugar}
                        onChange={(e) => setLugar(e.target.value)}
                        placeholder="Ej. Sala de Consejo FICCT - Módulo 236"
                        required
                        className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                        style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Video className="w-3.5 h-3.5" />
                        Enlace Videoconferencia {modalidad !== 'presencial' && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type="url"
                        value={enlaceVirtual}
                        onChange={(e) => setEnlaceVirtual(e.target.value)}
                        placeholder="https://meet.google.com/xyz-abcd-efg"
                        className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 transition font-mono"
                        style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                      />
                    </div>
                  </div>

                  {/* Tarjeta Informativa Institucional */}
                  <div className="p-3.5 rounded-lg border bg-sky-500/5 border-sky-500/20 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-3">
                    <ShieldAlert className="w-4 h-4 text-sistemas-cyan mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">Protocolo Institucional FICCT:</span> Al completar este asistente, el sistema compilará la carta formal en PDF membretado con numeración correlativa única, notificará a los correos institucionales de los miembros y anexará la invitación oficial a Google Calendar.
                    </div>
                  </div>

                  {/* Barra de Navegación del Paso 1 */}
                  <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <span className="text-xs text-slate-400">Verifica los datos generales antes de estructurar los temas.</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (validarPaso1()) setStep(2);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 transition shadow-xs cursor-pointer"
                    >
                      <span>Siguiente: Orden del Día</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* PASO 2: ORDEN DEL DÍA (TEMAS A TRATAR)                  */}
            {/* ======================================================== */}
            {step === 2 && (
              <div className="space-y-4">
                <div 
                  className="p-5 rounded-xl border shadow-xs space-y-4"
                  style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
                >
                  <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-800 dark:text-slate-200">
                        <Tag className="w-4 h-4 text-sistemas-cyan" />
                        2. Orden del Día (Temas a Tratar)
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Define los puntos a deliberar en la sesión. Puedes usar plantillas rápidas o agregar temas personalizados.
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-mono font-bold border border-sky-500/20 bg-sky-500/10 text-sistemas-cyan">
                      {ordenDelDia.length} punto(s) agregados
                    </span>
                  </div>

                  {/* Atajos Rápidos */}
                  <div className="p-3 rounded-lg border text-xs space-y-2"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}>
                    <div className="font-semibold text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">
                      Agregar Temas Rápidos Predefinidos:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => agregarPuntoPredefinido('Revisión y Aprobación de la Malla Curricular Plan 2026', '/malla')}
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium border hover:border-sky-500 hover:text-sky-600 transition flex items-center gap-1 cursor-pointer text-slate-700 dark:text-slate-300"
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        <Plus className="w-3 h-3 text-sistemas-cyan" />
                        Malla Curricular
                      </button>
                      <button
                        type="button"
                        onClick={() => agregarPuntoPredefinido('Validación del Grafo de Prerrequisitos y Seriación', '/grafo')}
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium border hover:border-sky-500 hover:text-sky-600 transition flex items-center gap-1 cursor-pointer text-slate-700 dark:text-slate-300"
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        <Plus className="w-3 h-3 text-sistemas-cyan" />
                        Grafo Prerrequisitos
                      </button>
                      <button
                        type="button"
                        onClick={() => agregarPuntoPredefinido('Subsanación de Observaciones Técnicas del Comité', '/observaciones')}
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium border hover:border-sky-500 hover:text-sky-600 transition flex items-center gap-1 cursor-pointer text-slate-700 dark:text-slate-300"
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        <Plus className="w-3 h-3 text-sistemas-cyan" />
                        Observaciones Comité
                      </button>
                      <button
                        type="button"
                        onClick={() => agregarPuntoPredefinido('Verificación de Documentos de Evidencia y Normativas', '/evidencias')}
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium border hover:border-sky-500 hover:text-sky-600 transition flex items-center gap-1 cursor-pointer text-slate-700 dark:text-slate-300"
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        <Plus className="w-3 h-3 text-sistemas-cyan" />
                        Evidencias y Leyes
                      </button>
                    </div>

                    {/* Selector de Capítulo Específico */}
                    {capitulosDisponibles.length > 0 && (
                      <div className="pt-2 flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">O elegir un capítulo específico:</span>
                        <select
                          onChange={(e) => {
                            agregarCapituloALaAgenda(e.target.value);
                            e.target.value = '';
                          }}
                          defaultValue=""
                          className="px-2.5 py-1 rounded-lg border text-xs flex-1 focus:outline-none focus:ring-1 focus:ring-sky-500"
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
                      className="flex-1 px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                      style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                    />
                    <input
                      type="text"
                      value={nuevoPuntoEnlace}
                      onChange={(e) => setNuevoPuntoEnlace(e.target.value)}
                      placeholder="Enlace opcional (ej. /malla)"
                      className="w-full sm:w-44 px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 transition font-mono"
                      style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                    />
                    <button
                      type="button"
                      onClick={agregarPuntoManual}
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
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
                        className="flex items-center justify-between p-3 rounded-lg border text-xs transition"
                        style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                      >
                        <div className="flex items-start gap-2.5 flex-1 pr-2">
                          <span className="font-bold text-sky-600 dark:text-sky-400 font-mono mt-0.5">{index + 1}.</span>
                          <div>
                            <div className="font-medium text-slate-800 dark:text-slate-200">{item.punto}</div>
                            {item.enlace && (
                              <div className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 mt-0.5 font-mono">
                                <ExternalLink className="w-3 h-3" />
                                {item.enlace}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarPuntoAgenda(index)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                          title="Eliminar tema"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Barra de Navegación del Paso 2 */}
                  <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setFormError('');
                        setStep(1);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300 cursor-pointer"
                      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Volver a Parámetros</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (validarPaso2()) setStep(3);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 transition shadow-xs cursor-pointer"
                    >
                      <span>Siguiente: Miembros y Quórum</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* PASO 3: CONVOCADOS, QUÓRUM Y EMISIÓN OFICIAL            */}
            {/* ======================================================== */}
            {step === 3 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Columna Izquierda: Tarjeta de Resumen de Sesión */}
                <div className="space-y-4">
                  <div 
                    className="p-5 rounded-xl border shadow-xs space-y-4"
                    style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
                  >
                    <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Resumen de la Sesión
                      </h3>
                      <button
                        type="button"
                        onClick={() => irAlPaso(1)}
                        className="text-[11px] text-sistemas-cyan hover:underline font-bold cursor-pointer"
                      >
                        Editar Datos
                      </button>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Título:</span>
                        <div className="font-semibold text-slate-800 dark:text-slate-100 leading-snug">{titulo}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Fecha:</span>
                          <div className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3 text-sky-500" />
                            {fechaReunion}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Hora:</span>
                          <div className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-sky-500" />
                            {horaReunion}
                          </div>
                        </div>
                      </div>

                      <div className="pt-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Modalidad y Lugar:</span>
                        <div className="font-medium text-slate-700 dark:text-slate-300 capitalize">{modalidad} • {lugar}</div>
                        {enlaceVirtual && (
                          <div className="text-[11px] text-sky-600 dark:text-sky-400 truncate font-mono mt-0.5">{enlaceVirtual}</div>
                        )}
                      </div>

                      <div className="pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Temas en Agenda:</span>
                          <button
                            type="button"
                            onClick={() => irAlPaso(2)}
                            className="text-[11px] text-sistemas-cyan hover:underline font-bold cursor-pointer"
                          >
                            Modificar ({ordenDelDia.length})
                          </button>
                        </div>
                        <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400 max-h-36 overflow-y-auto">
                          {ordenDelDia.map((it, idx) => (
                            <li key={idx} className="truncate" title={it.punto}>{it.punto}</li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Columna Central/Derecha: Matriz de Convocados y Botón Final */}
                <div className="lg:col-span-2 space-y-4">
                  <div 
                    className="p-5 rounded-xl border shadow-xs space-y-4"
                    style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
                  >
                    <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                      <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-800 dark:text-slate-200">
                        <Users className="w-4 h-4 text-sistemas-cyan" />
                        3. Convocatoria a Miembros y Quórum
                      </h2>
                      <span className="text-[11px] font-mono text-slate-400">Paso 3 de 3</span>
                    </div>

                    {/* Master Checkbox */}
                    <div className="p-3.5 rounded-lg border bg-sky-500/5 border-sky-500/20 space-y-1.5">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={(e) => toggleSelectAll(e.target.checked)}
                          className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-gray-300"
                        />
                        <span className="text-xs font-bold text-sky-700 dark:text-sky-300">
                          Seleccionar a todos los miembros (Recomendado)
                        </span>
                      </label>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-6 leading-relaxed">
                        Por defecto se convoca a la totalidad de los miembros activos de la comisión para garantizar quórum y validez institucional.
                      </p>
                    </div>

                    {/* Indicador de Exclusiones */}
                    {excluidosCount > 0 ? (
                      <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                        <UserX className="w-4 h-4 flex-shrink-0" />
                        <div>
                          <strong>{excluidosCount} miembro(s) desmarcado(s).</strong> Se requerirá confirmación explícita para registrar la exclusión en auditoría.
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        <span>Comisión completa seleccionada ({usuariosComision.length} docentes).</span>
                      </div>
                    )}

                    {/* Listado con checkboxes individuales */}
                    <div className="max-h-[340px] overflow-y-auto space-y-1.5 pr-1">
                      {loadingUsuarios ? (
                        <div className="text-center py-6 text-xs text-slate-400 animate-pulse">Cargando docentes...</div>
                      ) : usuariosComision.length === 0 ? (
                        <div className="text-center py-6 text-xs text-slate-400">No se encontraron docentes activos.</div>
                      ) : (
                        usuariosComision.map((u) => {
                          const isChecked = selectedUserIds.has(u.id);
                          return (
                            <div
                              key={u.id}
                              onClick={() => toggleUsuario(u.id)}
                              className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${
                                isChecked 
                                  ? 'border-sky-500/40 bg-sky-500/5' 
                                  : 'opacity-60 border-slate-200 dark:border-slate-800 hover:opacity-90'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-gray-300"
                                />
                                <div>
                                  <div className="font-semibold text-xs leading-tight text-slate-900 dark:text-white">
                                    {u.nombre_completo}
                                  </div>
                                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                    <Mail className="w-3 h-3" />
                                    {u.email}
                                  </div>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                                {u.rol?.nombre || 'Docente'}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Acciones Finales: Previsualizar y Emitir */}
                    <div className="pt-3 border-t space-y-2.5" style={{ borderColor: 'var(--border-color)' }}>
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            setFormError('');
                            setStep(2);
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300 cursor-pointer"
                          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Volver a Orden del Día</span>
                        </button>

                        <button
                          type="button"
                          onClick={handlePrevisualizarBorrador}
                          disabled={submitting || previewLoading || ordenDelDia.length === 0}
                          className="py-2 px-3.5 rounded-lg text-xs font-semibold border shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer text-slate-700 dark:text-slate-300"
                          style={{ borderColor: 'var(--border-color)' }}
                        >
                          {previewLoading ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin text-sistemas-cyan" />
                              Compilando Borrador...
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 text-sistemas-cyan" />
                              Previsualizar Carta PDF
                            </>
                          )}
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={submitting || selectedUserIds.size === 0}
                        className="w-full py-2.5 px-4 rounded-lg text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer bg-sky-500 hover:bg-sky-600 text-white"
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
                      <p className="text-[10px] text-center text-slate-400">
                        Se generará el archivo PDF institucional con firma digital, evento .ics y se registrará en la Bitácora de Auditoría.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 2: HISTORIAL DE CONVOCATORIAS EMITIDAS           */}
      {/* ======================================================== */}
      {activeTab === 'historial' && (
        <div className="space-y-4">
          <div 
            className="p-5 rounded-xl border shadow-xs space-y-4"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <Clock className="w-4 h-4 text-sistemas-cyan" />
                  Registro Histórico de Convocatorias Emitidas
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Listado cronológico de cartas de convocatoria generadas, trazabilidad de docentes convocados y actas oficiales.
                </p>
              </div>
              <button
                type="button"
                onClick={cargarHistorial}
                className="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Actualizar
              </button>
            </div>

            {loadingHistorial ? (
              <div className="text-center py-12 text-xs text-slate-400 animate-pulse">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sistemas-cyan" />
                Cargando historial de convocatorias...
              </div>
            ) : historial.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-lg text-slate-400 text-xs">
                No se han emitido convocatorias todavía.
              </div>
            ) : (
              <div className="space-y-3">
                {historial.map((conv) => {
                  const googleCalUrl = generarGoogleCalendarUrl(conv);
                  return (
                    <div 
                      key={conv.id}
                      className="p-4 rounded-xl border transition shadow-xs space-y-3"
                      style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                    >
                      {/* Cabecera de la Convocatoria */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                            {conv.codigo_convocatoria}
                          </span>
                          <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                            {conv.titulo}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePrevisualizarHistorial(conv)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30 hover:bg-sky-500/20 transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Previsualizar PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => descargarPdfDirecto(conv.id)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:bg-rose-500/20 transition cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Descargar Carta
                          </button>
                          <a
                            href={googleCalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200 transition cursor-pointer"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            Google Calendar
                          </a>
                        </div>
                      </div>

                      {/* Metadatos y Coordenadas */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                        <div className="p-2.5 rounded-lg border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Fecha y Hora</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{conv.fecha_reunion} • {conv.hora_reunion} hrs.</span>
                        </div>
                        <div className="p-2.5 rounded-lg border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Modalidad y Lugar</span>
                          <span className="font-bold capitalize text-slate-800 dark:text-slate-200">{conv.modalidad}</span>
                          <div className="text-[11px] text-slate-400 truncate">{conv.lugar}</div>
                        </div>
                        <div className="p-2.5 rounded-lg border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Convocados</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {conv.total_convocados} docentes
                          </span>
                          {conv.total_excluidos > 0 && (
                            <span className="text-[11px] text-rose-500 font-semibold ml-2">
                              ({conv.total_excluidos} excluidos)
                            </span>
                          )}
                        </div>
                        <div className="p-2.5 rounded-lg border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Convocante</span>
                          <span className="font-bold truncate block text-slate-800 dark:text-slate-200">{conv.convocador?.nombre_completo || 'Director de Carrera'}</span>
                        </div>
                      </div>

                      {/* Orden del Día Resumido */}
                      {conv.orden_del_dia && conv.orden_del_dia.length > 0 && (
                        <div className="pt-1 text-xs">
                          <span className="font-bold text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                            Orden del Día:
                          </span>
                          <ol className="list-decimal pl-5 space-y-0.5 text-slate-700 dark:text-slate-300">
                            {conv.orden_del_dia.map((item, idx) => (
                              <li key={idx}>
                                {typeof item === 'string' ? item : item.punto}
                                {typeof item !== 'string' && item.enlace && (
                                  <span className="text-sky-600 dark:text-sky-400 ml-1 font-mono text-[11px]">({item.enlace})</span>
                                )}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Botón para ver destinatarios expandidos */}
                      <div className="pt-2 flex items-center justify-between border-t" style={{ borderColor: 'var(--border-color)' }}>
                        <span className="text-[10px] text-slate-400">
                          Emitida el {new Date(conv.created_at).toLocaleDateString()} a las {new Date(conv.created_at).toLocaleTimeString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedConvocatoriaDetalle(selectedConvocatoriaDetalle?.id === conv.id ? null : conv)}
                          className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {selectedConvocatoriaDetalle?.id === conv.id ? 'Ocultar Destinatarios' : `Ver Lista de ${conv.destinatarios?.length || conv.total_convocados} Destinatarios`}
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${selectedConvocatoriaDetalle?.id === conv.id ? 'rotate-90' : ''}`} />
                        </button>
                      </div>

                      {/* Destinatarios Expandidos */}
                      {selectedConvocatoriaDetalle?.id === conv.id && (
                        <div className="mt-2.5 p-3 rounded-lg border bg-slate-500/5 space-y-2 text-xs">
                          <div className="font-bold text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Estado de Despacho de Correo por Docente:
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {conv.destinatarios?.map(dest => (
                              <div key={dest.id} className="p-2 rounded-lg border bg-white dark:bg-slate-900 flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-xs text-slate-900 dark:text-white">
                                    {dest.usuario?.nombre_completo || 'Docente'}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {dest.email_destinatario}
                                  </div>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                  dest.estado_envio === 'enviado' 
                                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                                    : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div 
            className="w-full max-w-lg p-6 rounded-xl border shadow-2xl space-y-4 animate-in zoom-in-95"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2.5 rounded-full bg-rose-500/10">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight text-slate-900 dark:text-white">
                  Confirmación de Emisión con Exclusiones
                </h3>
                <p className="text-xs text-slate-400">
                  Atención: No estás convocando a toda la comisión.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg border border-rose-500/30 bg-rose-500/5 text-xs space-y-2">
              <p className="font-medium text-slate-800 dark:text-slate-200">
                Has desmarcado a <strong>{excluidosCount} miembro(s)</strong> de la comisión de rediseño curricular:
              </p>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pl-2 border-l-2 border-rose-500/40">
                {usuariosExcluidos.map(u => (
                  <div key={u.id} className="text-[11px]">
                    • <span className="font-semibold text-slate-900 dark:text-white">{u.nombre_completo}</span> ({u.rol?.nombre}) — <span className="text-slate-400">{u.email}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs text-amber-800 dark:text-amber-200">
              <strong>Nota de Auditoría Inmutable:</strong> Esta exclusión quedará registrada formalmente en la bitácora de auditoría del sistema (<span className="font-mono">convocatoria_reunion_enviada</span>) especificando la cantidad de excluidos para fines de transparencia institucional.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowExclusionModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold border hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-slate-700 dark:text-slate-300"
                style={{ borderColor: 'var(--border-color)' }}
              >
                Volver y Revisar
              </button>
              <button
                type="button"
                onClick={procederConDespacho}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div 
            className="w-full max-w-5xl h-[92vh] flex flex-col rounded-xl border shadow-2xl overflow-hidden animate-in zoom-in-95"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sistemas-cyan">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs leading-tight truncate max-w-md sm:max-w-xl text-slate-900 dark:text-white">
                    {previewTitle}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Formato oficial con membrete UAGRM/FICCT, correlativo y orden del día.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir Pestaña
                </a>
                <a
                  href={previewPdfUrl}
                  download="Carta_Convocatoria.pdf"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar
                </a>
                <button
                  type="button"
                  onClick={cerrarModalPrevisualizacion}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition ml-1 cursor-pointer"
                  title="Cerrar visor"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Visor PDF Embebido */}
            <div className="flex-1 p-2 bg-slate-900/10 dark:bg-black/40 overflow-hidden">
              <iframe
                src={previewPdfUrl}
                className="w-full h-full rounded-lg border border-slate-300 dark:border-slate-800 shadow-inner bg-white"
                title="Visor de Carta Oficial de Convocatoria"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
