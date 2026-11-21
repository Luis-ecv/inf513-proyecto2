import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import type { Capitulo, DocumentoEvidencia, VersionCapitulo } from '../types';
import { 
  ArrowLeft, CheckCircle2, Clock, AlertTriangle, FileEdit, 
  MessageSquare, Archive, History, UserCheck, AlertCircle, 
  Send, ShieldCheck, Check, Paperclip, X, GitCompare, UploadCloud,
  FileCheck2, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ChapterDiffViewer } from '../components/chapters/ChapterDiffViewer';
import { extractTextFromFile } from '../utils/pdfExtractor';

export const ChapterDetail: React.FC = () => {
  const { user } = useAuth();
  const esInvitado = user?.rol?.toLowerCase() === 'invitado';
  const { id } = useParams<{ id: string }>();

  const [capitulo, setCapitulo] = useState<Capitulo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'contenido' | 'observaciones' | 'evidencias' | 'historial' | 'versiones'>('contenido');

  // Historial de Versiones y Diff (Módulo de Documentación y Redacción)
  const [versiones, setVersiones] = useState<VersionCapitulo[]>([]);
  const [loadingVersiones, setLoadingVersiones] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resumenCambio, setResumenCambio] = useState('');
  const [uploadingVersion, setUploadingVersion] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Transición de Máquina de Estados (RF-06, RF-07, RF-10)
  const [nuevoEstadoId, setNuevoEstadoId] = useState<number>(1);
  const [justificacion, setJustificacion] = useState('');
  const [transError, setTransError] = useState('');
  const [transSuccess, setTransSuccess] = useState('');
  const [submittingTrans, setSubmittingTrans] = useState(false);

  // Nueva observación técnica (RF-08)
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [submittingObs, setSubmittingObs] = useState(false);
  const [obsError, setObsError] = useState('');

  // Subsanación de observación (RF-08)
  const [subsanarId, setSubsanarId] = useState<number | null>(null);
  const [respuestaSubsanacion, setRespuestaSubsanacion] = useState('');
  const [submittingSub, setSubmittingSub] = useState(false);

  // Vincular evidencia existente (RF-13)
  const [evidenciasDisponibles, setEvidenciasDisponibles] = useState<DocumentoEvidencia[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | ''>('');
  const [showVincularModal, setShowVincularModal] = useState(false);
  const [vincularError, setVincularError] = useState('');

  const fetchCapitulo = useCallback(async () => {
    try {
      const res = await api.get(`/capitulos/${id}`);
      if (res.data.success) {
        setCapitulo(res.data.capitulo);
        setNuevoEstadoId(res.data.capitulo.id_estado);
      }
    } catch (err) {
      console.error('Error al cargar detalle del capítulo:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchEvidenciasDisponibles = useCallback(async () => {
    try {
      const res = await api.get('/evidencias');
      if (res.data.success) {
        setEvidenciasDisponibles(res.data.documentos);
      }
    } catch (err) {
      console.error('Error al cargar catálogo de evidencias:', err);
    }
  }, []);

  const fetchVersiones = useCallback(async () => {
    setLoadingVersiones(true);
    try {
      const res = await api.get(`/capitulos/${id}/versiones`);
      if (res.data.success) {
        setVersiones(res.data.versiones);
      }
    } catch (err) {
      console.error('Error al cargar historial de versiones:', err);
    } finally {
      setLoadingVersiones(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCapitulo();
    fetchEvidenciasDisponibles();
    fetchVersiones();
  }, [fetchCapitulo, fetchEvidenciasDisponibles, fetchVersiones]);

  const handleFileChange = (file: File | null) => {
    setUploadError('');
    setUploadSuccess('');
    if (!file) {
      setSelectedFile(null);
      return;
    }
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'md', 'txt'].includes(extension || '')) {
      setUploadError('Formato no soportado. Debe adjuntar un archivo PDF (.pdf), Markdown (.md) o Texto (.txt).');
      setSelectedFile(null);
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setUploadError('El archivo excede el tamaño máximo permitido de 15 MB.');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleUploadNuevaVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Por favor selecciona o arrastra un archivo digital antes de enviar.');
      return;
    }

    setUploadingVersion(true);
    setUploadError('');
    setUploadSuccess('');
    setUploadProgressMsg('Extrayendo texto digital del documento...');

    try {
      const extractedText = await extractTextFromFile(selectedFile);
      setUploadProgressMsg('Subiendo documento y registrando versión en el servidor...');

      const formData = new FormData();
      formData.append('archivo', selectedFile);
      formData.append('contenido_texto', extractedText);
      if (resumenCambio.trim()) {
        formData.append('resumen_cambio', resumenCambio.trim());
      }

      const res = await api.post(`/capitulos/${id}/versiones`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setUploadSuccess(res.data.message || 'Nueva versión publicada exitosamente.');
        setSelectedFile(null);
        setResumenCambio('');
        await Promise.all([fetchVersiones(), fetchCapitulo()]);
      }
    } catch (err: any) {
      console.error('Error al subir nueva versión:', err);
      setUploadError(
        err.response?.data?.message || err.message || 'Error al procesar y subir la nueva versión.'
      );
    } finally {
      setUploadingVersion(false);
      setUploadProgressMsg('');
    }
  };

  const handleCambiarEstado = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransError('');
    setTransSuccess('');

    if (!justificacion.trim() || justificacion.trim().length < 10) {
      setTransError('La justificación técnica es obligatoria y debe tener al menos 10 caracteres.');
      return;
    }

    setSubmittingTrans(true);
    try {
      const res = await api.put(`/capitulos/${id}/estado`, {
        id_estado: nuevoEstadoId,
        justificacion_tecnica: justificacion.trim(),
      });

      if (res.data.success) {
        setTransSuccess(res.data.message);
        setJustificacion('');
        await fetchCapitulo();
      }
    } catch (err: any) {
      setTransError(err.response?.data?.message || 'Error al ejecutar la transición de estado.');
    } finally {
      setSubmittingTrans(false);
    }
  };

  const handleCrearObservacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setObsError('');

    if (!nuevoComentario.trim()) {
      setObsError('El comentario técnico es obligatorio.');
      return;
    }

    setSubmittingObs(true);
    try {
      const res = await api.post(`/capitulos/${id}/observaciones`, {
        comentario: nuevoComentario.trim(),
        cambiar_a_observado: true,
      });

      if (res.data.success) {
        setNuevoComentario('');
        await fetchCapitulo();
      }
    } catch (err: any) {
      setObsError(err.response?.data?.message || 'Error al registrar observación.');
    } finally {
      setSubmittingObs(false);
    }
  };

  const handleSubsanarObservacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subsanarId || !respuestaSubsanacion.trim()) return;

    setSubmittingSub(true);
    try {
      const res = await api.put(`/observaciones/${subsanarId}/subsanar`, {
        respuesta_delegado: respuestaSubsanacion.trim(),
      });

      if (res.data.success) {
        setSubsanarId(null);
        setRespuestaSubsanacion('');
        await fetchCapitulo();
      }
    } catch (err) {
      console.error('Error al subsanar observación:', err);
    } finally {
      setSubmittingSub(false);
    }
  };

  const handleVincularEvidencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId) return;

    try {
      const res = await api.post('/evidencias/vincular-capitulo', {
        id_capitulo: id,
        id_documento: selectedDocId,
      });

      if (res.data.success) {
        setShowVincularModal(false);
        setSelectedDocId('');
        await fetchCapitulo();
      }
    } catch (err: any) {
      setVincularError(err.response?.data?.message || 'Error al vincular evidencia.');
    }
  };

  const handleDesvincularEvidencia = async (docId: number) => {
    if (!confirm('¿Deseas desvincular este documento de evidencia del capítulo?')) return;

    try {
      const res = await api.post('/evidencias/desvincular-capitulo', {
        id_capitulo: id,
        id_documento: docId,
      });

      if (res.data.success) {
        await fetchCapitulo();
      }
    } catch (err) {
      console.error('Error al desvincular evidencia:', err);
    }
  };

  const getStatusBadge = (estadoNombre?: string) => {
    switch (estadoNombre) {
      case 'Aprobado':
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Aprobado
          </span>
        );
      case 'En Revisión':
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
            <span className="w-2 h-2 rounded-full bg-purple-500" /> En Revisión
          </span>
        );
      case 'Observado':
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Observado
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Borrador
          </span>
        );
    }
  };

  if (loading || !capitulo) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-xs font-semibold text-slate-400 animate-pulse flex items-center gap-2">
          <Clock className="w-4 h-4 animate-spin text-sistemas-cyan" />
          Cargando datos técnicos del capítulo...
        </div>
      </div>
    );
  }

  const observaciones = capitulo.observaciones || [];
  const pendientesCount = observaciones.filter(o => !o.resuelta).length;
  const evidencias = capitulo.evidencias || [];
  const historial = capitulo.historial || [];

  return (
    <div className="space-y-4">
      {/* 1. Barra de Navegación y Encabezado del Capítulo */}
      <div 
        className="p-5 rounded-xl border shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-start gap-3">
          <Link
            to="/capitulos"
            className="p-2 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition mt-0.5 text-slate-700 dark:text-slate-300"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
            title="Volver a Capítulos"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-mono">
                Componente #{capitulo.componente?.numero}: {capitulo.componente?.nombre}
              </span>
              <span className="text-xs text-slate-400 font-medium font-mono">Capítulo #{capitulo.numero}</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              {capitulo.titulo}
            </h1>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <UserCheck className="w-3.5 h-3.5 text-sistemas-cyan" />
              <span>
                Redactores: <strong className="text-slate-700 dark:text-slate-300">{capitulo.redactores && capitulo.redactores.length > 0
                  ? capitulo.redactores.map(r => r.nombreCompleto).join(', ')
                  : 'Sin redactor asignado'}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Estado Actual */}
        <div className="flex items-center gap-3">
          {getStatusBadge(capitulo.estado?.nombre)}
        </div>
      </div>

      {/* 2. Panel de Control de la Máquina de Estados (CU5, RF-06, RF-07, RF-10) */}
      <div 
        className="p-4 rounded-xl border shadow-2xs space-y-3"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-sistemas-cyan">
            <ShieldCheck className="w-4 h-4" /> Transición Formal de Estado Curricular
          </h2>
          <span className="text-[11px] text-slate-400">Auditoría criptográfica inmutable activa</span>
        </div>

        {transError && (
          <div className="p-2.5 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{transError}</span>
          </div>
        )}

        {transSuccess && (
          <div className="p-2.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{transSuccess}</span>
          </div>
        )}

        <form onSubmit={handleCambiarEstado} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Nuevo Estado Destino:</label>
            <select
              value={nuevoEstadoId}
              onChange={(e) => setNuevoEstadoId(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
              style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
            >
              <option value={1}>1. Borrador (Redacción Inicial)</option>
              <option value={2}>2. En Revisión (Evaluación de Autoridades)</option>
              <option value={3}>3. Observado (Presenta señalamientos)</option>
              <option value={4}>4. Aprobado (Validado con evidencias)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Justificación Técnica del Cambio:</label>
            <input
              type="text"
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              placeholder="Explica el motivo técnico o académico de la transición..."
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
              style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
              required
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={submittingTrans || nuevoEstadoId === capitulo.id_estado}
              className="w-full py-2 px-3 rounded-lg font-bold shadow-xs transition disabled:opacity-40 bg-sky-500 hover:bg-sky-600 text-white"
            >
              {submittingTrans ? 'Validando...' : 'Aplicar Transición'}
            </button>
          </div>
        </form>

        {/* Precondiciones para Aprobación */}
        {nuevoEstadoId === 4 && (
          <div 
            className="p-3 rounded-lg border text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-2"
            style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center gap-1.5 font-medium">
              {pendientesCount === 0 ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-500" />
              )}
              <span className={pendientesCount === 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}>
                0 Observaciones pendientes ({pendientesCount} activas)
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              {evidencias.length > 0 ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-500" />
              )}
              <span className={evidencias.length > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}>
                Al menos 1 evidencia vinculada ({evidencias.length} adjuntas)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Pestañas de Navegación del Capítulo */}
      <div className="flex items-center gap-1 border-b text-xs font-semibold overflow-x-auto" style={{ borderColor: 'var(--border-color)' }}>
        <button
          onClick={() => setActiveTab('contenido')}
          className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'contenido' ? 'border-sky-500 text-sky-600 dark:text-sky-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileEdit className="w-4 h-4" /> Texto del Capítulo
        </button>

        <button
          onClick={() => setActiveTab('observaciones')}
          className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 shrink-0 relative ${
            activeTab === 'observaciones' ? 'border-sky-500 text-sky-600 dark:text-sky-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Observaciones Técnicas
          {pendientesCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
              {pendientesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('evidencias')}
          className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'evidencias' ? 'border-sky-500 text-sky-600 dark:text-sky-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Archive className="w-4 h-4" /> Evidencias Adjuntas ({evidencias.length})
        </button>

        <button
          onClick={() => setActiveTab('historial')}
          className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'historial' ? 'border-sky-500 text-sky-600 dark:text-sky-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" /> Auditoría Inmutable ({historial.length})
        </button>

        <button
          onClick={() => setActiveTab('versiones')}
          className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'versiones' ? 'border-sky-500 text-sky-600 dark:text-sky-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <GitCompare className="w-4 h-4 text-sistemas-cyan" /> Historial de Versiones (Diff)
          {versiones.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-sky-500/10 text-sistemas-cyan text-[10px] font-bold border border-sky-500/20 font-mono">
              v{versiones[0]?.numero_version}
            </span>
          )}
        </button>
      </div>

      {/* 4. Contenido según pestaña activa */}
      {activeTab === 'contenido' && (
        <div 
          className="p-5 rounded-xl border shadow-xs space-y-3"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
        >
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Contenido Redactado del Capítulo</h2>
          {capitulo.contenido ? (
            <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-200 font-normal">
              {capitulo.contenido}
            </div>
          ) : (
            <div 
              className="text-center py-8 text-xs text-slate-400 border border-dashed rounded-lg" 
              style={{ borderColor: 'var(--border-color)' }}
            >
              No se ha redactado texto preliminar para este capítulo. Los redactores pueden subir documentos en la pestaña de versiones.
            </div>
          )}
        </div>
      )}

      {/* Pestaña: Observaciones Técnicas */}
      {activeTab === 'observaciones' && (
        <div className="space-y-4">
          {/* Formulario de Emisión de Observaciones */}
          <div 
            className="p-4 rounded-xl border shadow-2xs space-y-3"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
          >
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-sistemas-cyan">
              <MessageSquare className="w-4 h-4" /> Emitir Observación Técnica (Autoridades / Comité)
            </h3>

            {obsError && (
              <div className="p-2.5 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{obsError}</span>
              </div>
            )}

            <form onSubmit={handleCrearObservacion} className="space-y-3 text-xs">
              <textarea
                rows={3}
                value={nuevoComentario}
                onChange={(e) => setNuevoComentario(e.target.value)}
                placeholder="Escribe el señalamiento u observación técnica sobre este capítulo..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                required
              />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500">
                  Al emitir la observación, el capítulo cambiará automáticamente al estado 'Observado'.
                </span>
                <button
                  type="submit"
                  disabled={submittingObs}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold shadow-xs transition disabled:opacity-50 bg-sky-500 hover:bg-sky-600 text-white self-end sm:self-auto"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingObs ? 'Registrando...' : 'Registrar Observación'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Listado de Observaciones */}
          <div className="space-y-2.5">
            {observaciones.length === 0 ? (
              <div 
                className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl" 
                style={{ borderColor: 'var(--border-color)' }}
              >
                No existen observaciones registradas para este capítulo.
              </div>
            ) : (
              observaciones.map((obs) => (
                <div 
                  key={obs.id}
                  className="p-3.5 rounded-xl border shadow-2xs space-y-2.5"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                >
                  <div className="flex items-center justify-between text-xs border-b pb-2" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{obs.observador?.nombre_completo || 'Autoridad'}</span>
                      <span className="text-slate-400 text-[11px]">
                        {new Date(obs.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {obs.resuelta ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Subsanada
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                        <AlertTriangle className="w-3 h-3 text-amber-500" /> Pendiente
                      </span>
                    )}
                  </div>

                  <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200 font-medium">{obs.comentario}</p>

                  {/* Respuesta del Delegado */}
                  {obs.resuelta && obs.respuesta_delegado && (
                    <div 
                      className="p-2.5 rounded-lg border-l-3 border-l-emerald-500 text-xs text-slate-600 dark:text-slate-300"
                      style={{ backgroundColor: 'var(--bg-app)' }}
                    >
                      <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-between mb-0.5">
                        <span>Respuesta de Subsanación:</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {obs.fecha_respuesta ? new Date(obs.fecha_respuesta).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <p>{obs.respuesta_delegado}</p>
                    </div>
                  )}

                  {/* Formulario de Subsanación Inline */}
                  {!esInvitado && !obs.resuelta && (
                    <div className="pt-1">
                      {subsanarId === obs.id ? (
                        <form onSubmit={handleSubsanarObservacion} className="space-y-2 text-xs">
                          <textarea
                            rows={2}
                            value={respuestaSubsanacion}
                            onChange={(e) => setRespuestaSubsanacion(e.target.value)}
                            placeholder="Detalla cómo fue corregida o subsanada técnicamente esta observación..."
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                            style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                            required
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSubsanarId(null)}
                              className="px-3 py-1.5 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition font-semibold"
                              style={{ borderColor: 'var(--border-color)' }}
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              disabled={submittingSub}
                              className="px-3 py-1.5 rounded-lg font-bold shadow-xs transition bg-sky-500 hover:bg-sky-600 text-white"
                            >
                              {submittingSub ? 'Guardando...' : 'Confirmar Subsanación'}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          onClick={() => {
                            setSubsanarId(obs.id);
                            setRespuestaSubsanacion('');
                          }}
                          className="px-3 py-1 rounded-md border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300"
                          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
                        >
                          Responder / Subsanar Observación →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Pestaña: Evidencias Normativas Adjuntas */}
      {activeTab === 'evidencias' && (
        <div 
          className="p-5 rounded-xl border shadow-xs space-y-3.5"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-sistemas-cyan">
                <Archive className="w-4 h-4" /> Documentos de Respaldo Vinculados
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Al menos un documento normativo es obligatorio para la aprobación formal del capítulo.
              </p>
            </div>

            <button
              onClick={() => setShowVincularModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition bg-sky-500 hover:bg-sky-600 text-white"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>Adjuntar Evidencia</span>
            </button>
          </div>

          {evidencias.length === 0 ? (
            <div 
              className="text-center py-8 text-xs text-slate-400 border border-dashed rounded-lg" 
              style={{ borderColor: 'var(--border-color)' }}
            >
              No hay documentos de evidencia vinculados a este capítulo todavía.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {evidencias.map((doc) => (
                <div 
                  key={doc.id}
                  className="p-3 rounded-lg border flex items-center justify-between gap-3 text-xs"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                >
                  <div className="min-w-0">
                    <div className="font-mono font-bold text-sistemas-cyan truncate">{doc.codigo_norma}</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-100 truncate">{doc.titulo}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {doc.organo_emisor} • {doc.tipo_documento}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDesvincularEvidencia(doc.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition shrink-0"
                    style={{ borderColor: 'var(--border-color)' }}
                    title="Desvincular del capítulo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pestaña: Pista de Auditoría Histórica Inmutable */}
      {activeTab === 'historial' && (
        <div 
          className="p-5 rounded-xl border shadow-xs space-y-3.5"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
        >
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-sistemas-cyan">
              <History className="w-4 h-4" /> Pista Histórica Inmutable de Modificaciones
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Registro cronológico inmutable de transiciones de estado, justificaciones y responsables.
            </p>
          </div>

          <div className="relative border-l ml-3 pl-4 space-y-3.5" style={{ borderColor: 'var(--border-color)' }}>
            {historial.map((item) => (
              <div key={item.id} className="relative text-xs space-y-1">
                <span className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-sistemas-cyan border-2 border-white dark:border-slate-900" />
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sistemas-cyan">{item.estado_anterior} ➔ {item.estado_nuevo}</span>
                  <span className="text-slate-400 text-[10px]">
                    {new Date(item.fecha_hora).toLocaleString()}
                  </span>
                </div>
                <div className="text-slate-600 dark:text-slate-300 font-medium">
                  {item.descripcion_accion} • Responsable: <span className="font-semibold text-slate-800 dark:text-slate-100">{item.usuario?.nombre_completo || 'Usuario'}</span>
                </div>
                <div 
                  className="p-2.5 rounded-lg border text-[11px] text-slate-600 dark:text-slate-300 italic" 
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                >
                  "{item.justificacion_tecnica}"
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pestaña: Historial de Versiones y Diff Visual */}
      {activeTab === 'versiones' && (
        <div className="space-y-4">
          {/* Zona de Carga / Entrega de Nueva Versión */}
          {!esInvitado && (
            <div 
              className="p-5 rounded-xl border shadow-xs space-y-3.5"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-sky-500/10 text-sistemas-cyan">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Publicar Nueva Versión del Documento
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Sube la versión corregida tras subsanar observaciones técnicas.
                    </p>
                  </div>
                </div>
                {versiones.length > 0 && (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/20 font-mono">
                    Próxima versión: v{(versiones[0]?.numero_version || 0) + 1}
                  </span>
                )}
              </div>

              {uploadError && (
                <div className="p-2.5 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="p-2.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              <form onSubmit={handleUploadNuevaVersion} className="space-y-3 text-xs">
                {/* Zona Drag & Drop */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileChange(file);
                  }}
                  onClick={() => document.getElementById('chapter-version-file-input')?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
                    isDragOver 
                      ? 'border-sky-500 bg-sky-500/10' 
                      : selectedFile 
                      ? 'border-emerald-500/50 bg-emerald-500/5' 
                      : 'border-slate-300 dark:border-slate-700 hover:border-sky-500/60'
                  }`}
                >
                  <input
                    id="chapter-version-file-input"
                    type="file"
                    accept=".pdf,.md,.txt"
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                    disabled={uploadingVersion}
                  />

                  {selectedFile ? (
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                        <FileCheck2 className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-100">{selectedFile.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {(selectedFile.size / 1024).toFixed(1)} KB • Formato: {selectedFile.name.split('.').pop()?.toUpperCase()}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        className="ml-3 p-1 rounded-md border text-rose-500 hover:bg-rose-500/10 transition"
                        style={{ borderColor: 'var(--border-color)' }}
                        title="Quitar archivo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-7 h-7 text-sistemas-cyan opacity-60" />
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Arrastra y suelta tu archivo PDF o Markdown aquí, o haz clic para examinar
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Formatos soportados: .pdf, .md y .txt (hasta 15 MB)
                      </div>
                    </>
                  )}
                </div>

                {/* Motivo o resumen del cambio */}
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Motivo o Resumen de la Subsanación / Entrega (opcional):
                  </label>
                  <input
                    type="text"
                    value={resumenCambio}
                    onChange={(e) => setResumenCambio(e.target.value)}
                    placeholder="Ej: Se subsanaron las observaciones del Comité corrigiendo el perfil de egreso..."
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                    style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                    disabled={uploadingVersion}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    {uploadingVersion && (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-500" />
                        <span>{uploadProgressMsg}</span>
                      </>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={!selectedFile || uploadingVersion}
                    className="px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-sky-500 hover:bg-sky-600 text-white"
                  >
                    {uploadingVersion ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Procesando...</span>
                      </>
                    ) : (
                      <>
                        <GitCompare className="w-3.5 h-3.5" />
                        <span>Publicar Versión #{(versiones[0]?.numero_version || 0) + 1}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Componente Comparador Diff */}
          {loadingVersiones ? (
            <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-sistemas-cyan" />
              <span>Cargando versiones y diferencias textuales...</span>
            </div>
          ) : (
            <ChapterDiffViewer versiones={versiones} />
          )}
        </div>
      )}

      {/* Modal para Vincular Evidencia */}
      {showVincularModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            className="w-full max-w-md p-6 rounded-xl border shadow-2xl relative"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
          >
            <button 
              onClick={() => setShowVincularModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-sm font-bold flex items-center gap-2 mb-1 text-slate-900 dark:text-white">
              <Paperclip className="w-4 h-4 text-sky-500" /> Vincular Evidencia Normativa
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Selecciona una resolución o documento del repositorio digital de la carrera.
            </p>

            {vincularError && (
              <div className="mb-4 p-2.5 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{vincularError}</span>
              </div>
            )}

            <form onSubmit={handleVincularEvidencia} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Documento Normativo:</label>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                  required
                >
                  <option value="">Selecciona un documento...</option>
                  {evidenciasDisponibles.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.codigo_norma} - {doc.titulo} ({doc.organo_emisor})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setShowVincularModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition font-semibold text-slate-700 dark:text-slate-300"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-bold shadow-xs transition bg-sky-500 hover:bg-sky-600 text-white"
                >
                  Vincular al Capítulo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
