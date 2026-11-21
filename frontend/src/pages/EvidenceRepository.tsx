import React, { useEffect, useState } from 'react';
import api from '../services/api';
import type { DocumentoEvidencia } from '../types';
import { 
  Archive, Plus, Search, Filter, Download, 
  Calendar, CheckCircle2, X, AlertCircle, RotateCcw, Link2, Trash2,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EmptyState } from '../components/common/EmptyState';

export const EvidenceRepository: React.FC = () => {
  const tiposIniciales = [
    'Resolución ICU',
    'Resolución Facultativa',
    'Dictamen Académico',
    'Acta de Comisión',
    'Convenio Interinstitucional',
  ];
  const { user } = useAuth();
  const esInvitado = user?.rol?.toLowerCase() === 'invitado';
  const puedeEliminar = ['director', 'delegado'].includes(user?.rol?.toLowerCase() || '');
  const [documentos, setDocumentos] = useState<DocumentoEvidencia[]>([]);
  const [facetas, setFacetas] = useState<{ tipos: string[] }>({ tipos: [] });
  const [tiposDocumento, setTiposDocumento] = useState<string[]>(() => {
    const guardados = localStorage.getItem('tipos_documento_evidencia');
    return guardados ? JSON.parse(guardados) : tiposIniciales;
  });
  const [loading, setLoading] = useState(true);

  // Filtros facetados (RF-14)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Modal para subir nueva evidencia (RF-11, RF-12)
  const [showModal, setShowModal] = useState(false);
  const [codigoNorma, setCodigoNorma] = useState('');
  const [titulo, setTitulo] = useState('');
  const [tipoDoc, setTipoDoc] = useState('Resolución ICU');
  const [fechaEmision, setFechaEmision] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [idPadre, setIdPadre] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchDocumentos = async () => {
    try {
      const params: any = {};
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (selectedTipo) params.tipo_documento = selectedTipo;
      if (fechaDesde) params.fecha_desde = fechaDesde;
      if (fechaHasta) params.fecha_hasta = fechaHasta;

      const res = await api.get('/evidencias', { params });
      if (res.data.success) {
        setDocumentos(res.data.documentos);
        if (res.data.facetas) {
          setFacetas(res.data.facetas);
          setTiposDocumento((actuales) => Array.from(new Set([...actuales, ...res.data.facetas.tipos])));
        }
      }
    } catch (err) {
      console.error('Error al cargar evidencias normativas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentos();
  }, [selectedTipo, fechaDesde, fechaHasta]);

  useEffect(() => {
    localStorage.setItem('tipos_documento_evidencia', JSON.stringify(tiposDocumento));
  }, [tiposDocumento]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocumentos();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedTipo('');
    setFechaDesde('');
    setFechaHasta('');
    setTimeout(fetchDocumentos, 50);
  };

  const handleSubirDocumento = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!codigoNorma.trim() || !titulo.trim() || !fechaEmision || !archivo) {
      setFormError('Por favor complete todos los campos obligatorios y adjunte el archivo.');
      return;
    }

    const formData = new FormData();
    formData.append('codigo_norma', codigoNorma.trim());
    formData.append('titulo', titulo.trim());
    formData.append('tipo_documento', tipoDoc);
    formData.append('fecha_emision', fechaEmision);
    formData.append('archivo', archivo);
    if (idPadre) {
      formData.append('id_documento_padre', String(idPadre));
    }

    setSaving(true);
    try {
      const res = await api.post('/evidencias', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setShowModal(false);
        setCodigoNorma('');
        setTitulo('');
        setFechaEmision('');
        setArchivo(null);
        await fetchDocumentos();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Error al cargar documento de evidencia.');
    } finally {
      setSaving(false);
    }
  };

  const handleDescargar = async (doc: DocumentoEvidencia) => {
    try {
      const res = await api.get(`/evidencias/${doc.id}/descargar`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.codigo_norma}-${doc.titulo}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al descargar evidencia:', err);
      window.alert('No se pudo descargar este documento.');
    }
  };

  const handleEliminar = async (doc: DocumentoEvidencia) => {
    if (!window.confirm(`¿Deseas eliminar el documento "${doc.codigo_norma} - ${doc.titulo}"?`)) return;

    try {
      await api.delete(`/evidencias/${doc.id}`);
      await fetchDocumentos();
    } catch (err: any) {
      window.alert(err.response?.data?.message || 'No se pudo eliminar el documento.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-xs font-semibold text-slate-400 animate-pulse flex items-center gap-2">
          <Archive className="w-4 h-4 animate-spin text-sistemas-cyan" />
          Cargando catálogo normativo de evidencias...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Cabecera del Repositorio */}
      <div 
        className="p-5 rounded-xl border shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Módulo 3 • Evidencias Normativas
            </span>
            <span className="text-xs text-slate-400 font-medium">Marco Jurídico Académico</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Repositorio Digital de Evidencias
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Resoluciones ICU, dictámenes facultativos, actas de comisión y jerarquías que sustentan el plan curricular.
          </p>
        </div>

        {!esInvitado && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold shadow-xs transition bg-sky-500 hover:bg-sky-600 text-white self-start sm:self-auto shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Subir Evidencia Normativa</span>
          </button>
        )}
      </div>

      {/* 2. Barra de Filtros Facetados (RF-14) */}
      <div 
        className="p-4 rounded-xl border shadow-2xs space-y-3"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-sistemas-cyan">
            <Filter className="w-3.5 h-3.5" /> Búsqueda Facetada y Filtros
          </h2>
          {(searchQuery || selectedTipo || fechaDesde || fechaHasta) && (
            <button
              onClick={handleResetFilters}
              className="text-xs flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition font-medium"
            >
              <RotateCcw className="w-3 h-3" /> Limpiar Filtros
            </button>
          )}
        </div>

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Palabra clave / Código */}
          <div className="lg:col-span-2">
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 text-[11px]">Palabra Clave o Código:</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ej: RES-ICU-042 o rediseño..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
              />
            </div>
          </div>

          {/* Tipo de Documento */}
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 text-[11px]">Tipo de Norma:</label>
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
              style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
            >
              <option value="">Todos los tipos</option>
              {facetas.tipos.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Rango de Fechas */}
          <div className="flex gap-2 lg:col-span-2">
            <div className="flex-1">
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 text-[11px]">Fecha Desde:</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full px-2 py-1.5 border rounded-lg focus:outline-none text-xs font-medium"
                style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
              />
            </div>
            <div className="flex-1">
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 text-[11px]">Fecha Hasta:</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full px-2 py-1.5 border rounded-lg focus:outline-none text-xs font-medium"
                style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
              />
            </div>
          </div>
        </form>
      </div>

      {/* 3. Listado de Documentos */}
      <div className="space-y-3">
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Encontrados <span className="font-bold text-slate-800 dark:text-slate-200">{documentos.length}</span> documento(s) normativo(s)
        </div>

        {documentos.length === 0 ? (
          <EmptyState
            illustration="documents"
            title="Sin Documentos de Evidencia"
            description="No se encontraron resoluciones ICU, dictámenes ni evidencias normativas que coincidan con los filtros aplicados."
            actionLabel={searchQuery || selectedTipo || fechaDesde || fechaHasta ? "Restablecer Filtros" : undefined}
            onAction={handleResetFilters}
            className="border border-dashed rounded-xl"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {documentos.map((doc) => (
              <div 
                key={doc.id}
                className="p-4 rounded-xl border shadow-2xs flex flex-col justify-between space-y-3 transition hover:border-slate-400 dark:hover:border-slate-600"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono font-bold text-xs text-sistemas-cyan uppercase tracking-wide">
                      {doc.codigo_norma}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Vigente
                    </span>
                  </div>

                  <h3 className="font-bold text-xs leading-snug line-clamp-2 text-slate-800 dark:text-slate-100" title={doc.titulo}>
                    {doc.titulo}
                  </h3>

                  <div className="mt-2 space-y-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Tipo:</span> {doc.tipo_documento}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      <span>Emisión: {doc.fecha_emision}</span>
                    </div>

                    {/* Jerarquía Normativa (RF-12) */}
                    {doc.documento_padre && (
                      <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 mt-1">
                        <Link2 className="w-3 h-3" /> Deriva de: {doc.documento_padre.codigo_norma}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2.5 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
                  <button
                    onClick={() => handleDescargar(doc)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-sistemas-cyan hover:underline"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar PDF</span>
                  </button>

                  {puedeEliminar && (
                    <button
                      onClick={() => handleEliminar(doc)}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                      title="Eliminar documento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Modal de Subida de Evidencia Normativa */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            className="w-full max-w-lg p-6 rounded-xl border shadow-2xl relative"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
          >
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-sm font-bold flex items-center gap-2 mb-1 text-slate-900 dark:text-white">
              <FileText className="w-4 h-4 text-emerald-500" /> Subir Evidencia Normativa
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Adjunta resoluciones, actas o dictámenes académicos con valor legal para el rediseño.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubirDocumento} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Código de la Norma:</label>
                  <input
                    type="text"
                    value={codigoNorma}
                    onChange={(e) => setCodigoNorma(e.target.value)}
                    placeholder="ej: RES-ICU-042/2026"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 uppercase font-mono font-bold"
                    style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Fecha de Emisión:</label>
                  <input
                    type="date"
                    value={fechaEmision}
                    onChange={(e) => setFechaEmision(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                    style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Título / Epígrafe del Documento:</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="ej: Aprobación del Nuevo Plan Curricular de Ingeniería en Sistemas"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Tipo de Documento:</label>
                  <select
                    value={tipoDoc}
                    onChange={(e) => setTipoDoc(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                    style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                  >
                    {tiposDocumento.map((tipo) => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Norma Jerárquica Superior (Opcional):</label>
                  <select
                    value={idPadre}
                    onChange={(e) => setIdPadre(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                    style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                  >
                    <option value="">Ninguna (Norma raíz)</option>
                    {documentos.map((d) => (
                      <option key={d.id} value={d.id}>{d.codigo_norma} - {d.titulo}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Archivo Digital (PDF o Documento):</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setArchivo(e.target.files ? e.target.files[0] : null)}
                  className="w-full px-3 py-1.5 border rounded-lg focus:outline-none file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-sky-500 file:text-white hover:file:bg-sky-600"
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                  required
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition font-semibold text-slate-700 dark:text-slate-300"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg font-bold shadow-xs transition disabled:opacity-50 bg-sky-500 hover:bg-sky-600 text-white"
                >
                  {saving ? 'Cargando Documento...' : 'Guardar Evidencia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
