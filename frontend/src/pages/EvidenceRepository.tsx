import React, { useEffect, useState } from 'react';
import api from '../services/api';
import type { DocumentoEvidencia } from '../types';
import { 
  Archive, Plus, Search, Filter, Download, 
  Calendar, CheckCircle2, X, AlertCircle, RotateCcw, Link2 
} from 'lucide-react';

export const EvidenceRepository: React.FC = () => {
  const [documentos, setDocumentos] = useState<DocumentoEvidencia[]>([]);
  const [facetas, setFacetas] = useState<{ tipos: string[]; emisores: string[] }>({ tipos: [], emisores: [] });
  const [loading, setLoading] = useState(true);

  // Filtros facetados (RF-14)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('');
  const [selectedEmisor, setSelectedEmisor] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Modal para subir nueva evidencia (RF-11, RF-12)
  const [showModal, setShowModal] = useState(false);
  const [codigoNorma, setCodigoNorma] = useState('');
  const [titulo, setTitulo] = useState('');
  const [tipoDoc, setTipoDoc] = useState('Resolución ICU');
  const [organoEmisor, setOrganoEmisor] = useState('Ilustre Consejo Universitario');
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
      if (selectedEmisor) params.organo_emisor = selectedEmisor;
      if (fechaDesde) params.fecha_desde = fechaDesde;
      if (fechaHasta) params.fecha_hasta = fechaHasta;

      const res = await api.get('/evidencias', { params });
      if (res.data.success) {
        setDocumentos(res.data.documentos);
        if (res.data.facetas) {
          setFacetas(res.data.facetas);
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
  }, [selectedTipo, selectedEmisor, fechaDesde, fechaHasta]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocumentos();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedTipo('');
    setSelectedEmisor('');
    setFechaDesde('');
    setFechaHasta('');
    setTimeout(fetchDocumentos, 50);
  };

  const handleSubirDocumento = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!codigoNorma.trim() || !titulo.trim() || !fechaEmision || !archivo) {
      setFormError('Por favor complete todos los campos mandatorios y adjunte el archivo.');
      return;
    }

    const formData = new FormData();
    formData.append('codigo_norma', codigoNorma.trim());
    formData.append('titulo', titulo.trim());
    formData.append('tipo_documento', tipoDoc);
    formData.append('organo_emisor', organoEmisor);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-sm opacity-60">Cargando catálogo normativo de evidencias...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabecera del Repositorio */}
      <div 
        className="p-6 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Módulo 3 • Evidencias Normativas
            </span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight mt-1">
            Repositorio Digital y Búsqueda Facetada
          </h1>
          <p className="text-xs opacity-60 mt-0.5">
            Resoluciones ICU, dictámenes, actas y jerarquías normativas que sustentan el rediseño.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition self-start sm:self-auto"
          style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-text)' }}
        >
          <Plus className="w-4 h-4" /> Subir Evidencia Normativa
        </button>
      </div>

      {/* Barra de Filtros Facetados (RF-14) */}
      <div 
        className="p-5 rounded-2xl border shadow-sm space-y-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--primary)' }}>
            <Filter className="w-4 h-4" /> Motor de Búsqueda Facetada Combinada (RF-14)
          </h2>
          {(searchQuery || selectedTipo || selectedEmisor || fechaDesde || fechaHasta) && (
            <button
              onClick={handleResetFilters}
              className="text-xs flex items-center gap-1 opacity-70 hover:opacity-100 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Limpiar Filtros
            </button>
          )}
        </div>

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Palabra clave / Código */}
          <div className="lg:col-span-2">
            <label className="block font-semibold mb-1">Palabra Clave o Código:</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 opacity-50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ej: RES-ICU-042 o rediseño..."
                className="w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none"
                style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
              />
            </div>
          </div>

          {/* Tipo de Documento */}
          <div>
            <label className="block font-semibold mb-1">Tipo de Norma:</label>
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none"
              style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
            >
              <option value="">Todos los tipos</option>
              {facetas.tipos.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Órgano Emisor */}
          <div>
            <label className="block font-semibold mb-1">Órgano Emisor:</label>
            <select
              value={selectedEmisor}
              onChange={(e) => setSelectedEmisor(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none"
              style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
            >
              <option value="">Todos los emisores</option>
              {facetas.emisores.map((em) => (
                <option key={em} value={em}>{em}</option>
              ))}
            </select>
          </div>

          {/* Rango de Fechas */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block font-semibold mb-1">Desde:</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full px-2 py-1.5 border rounded-lg focus:outline-none text-[11px]"
                style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
              />
            </div>
            <div className="flex-1">
              <label className="block font-semibold mb-1">Hasta:</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full px-2 py-1.5 border rounded-lg focus:outline-none text-[11px]"
                style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
              />
            </div>
          </div>
        </form>
      </div>

      {/* Listado de Documentos */}
      <div className="space-y-3">
        <div className="text-xs opacity-60">
          Encontrados {documentos.length} documento(s) normativo(s)
        </div>

        {documentos.length === 0 ? (
          <div className="p-12 text-center text-xs opacity-50 border border-dashed rounded-2xl" style={{ borderColor: 'var(--border-color)' }}>
            No se encontraron documentos normativos que coincidan con los criterios seleccionados.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documentos.map((doc) => (
              <div 
                key={doc.id}
                className="p-5 rounded-2xl border shadow-xs flex flex-col justify-between space-y-3 transition hover:shadow-md"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-extrabold text-xs text-blue-500 uppercase tracking-wide">
                      {doc.codigo_norma}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Vigente
                    </span>
                  </div>

                  <h3 className="font-bold text-sm leading-snug line-clamp-2">
                    {doc.titulo}
                  </h3>

                  <div className="mt-2.5 space-y-1 text-[11px] opacity-75">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">Órgano:</span> {doc.organo_emisor}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">Tipo:</span> {doc.tipo_documento}
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

                <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
                  <span className="text-[10px] opacity-60">
                    PDF Certificado
                  </span>
                  <a
                    href={`/storage/${doc.archivo_ruta}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:opacity-80 transition"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
                  >
                    <Download className="w-3.5 h-3.5 text-blue-500" /> Descargar
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para Subir Evidencia (RF-11, RF-12) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div 
            className="w-full max-w-lg p-6 rounded-2xl border shadow-2xl relative"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
          >
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border hover:opacity-80 transition"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-base font-bold flex items-center gap-2 mb-1">
              <Archive className="w-4 h-4 text-emerald-500" /> Subir Evidencia Digital
            </h2>
            <p className="text-xs opacity-60 mb-4">
              Carga un archivo PDF o imagen oficial para respaldo normativo de los capítulos.
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
                  <label className="block font-semibold mb-1">Código de Norma / Resolución:</label>
                  <input
                    type="text"
                    value={codigoNorma}
                    onChange={(e) => setCodigoNorma(e.target.value)}
                    placeholder="ej: RES-ICU-089/2026"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none uppercase"
                    style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Fecha de Emisión:</label>
                  <input
                    type="date"
                    value={fechaEmision}
                    onChange={(e) => setFechaEmision(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Título o Descripción de la Norma:</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="ej: Homologación del Nuevo Perfil Profesional TIC 2026"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Tipo de Documento:</label>
                  <select
                    value={tipoDoc}
                    onChange={(e) => setTipoDoc(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                  >
                    <option value="Resolución ICU">Resolución ICU</option>
                    <option value="Resolución Facultativa">Resolución Facultativa</option>
                    <option value="Dictamen Académico">Dictamen Académico</option>
                    <option value="Acta de Comisión">Acta de Comisión</option>
                    <option value="Convenio Interinstitucional">Convenio Interinstitucional</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Órgano Emisor:</label>
                  <select
                    value={organoEmisor}
                    onChange={(e) => setOrganoEmisor(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                  >
                    <option value="Ilustre Consejo Universitario">Ilustre Consejo Universitario</option>
                    <option value="Consejo Facultativo FICCT">Consejo Facultativo FICCT</option>
                    <option value="Dirección de Carrera">Dirección de Carrera</option>
                    <option value="Comisión Curricular">Comisión Curricular</option>
                    <option value="Vicerrectorado">Vicerrectorado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Jerarquía Normativa (Deriva de):</label>
                <select
                  value={idPadre}
                  onChange={(e) => setIdPadre(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                >
                  <option value="">Ninguna (Norma raíz independiente)</option>
                  {documentos.map((d) => (
                    <option key={d.id} value={d.id}>{d.codigo_norma} - {d.titulo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Archivo Digital (PDF o Imagen máx. 10MB):</label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setArchivo(e.target.files ? e.target.files[0] : null)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-500 file:text-white hover:file:opacity-80"
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                  required
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:opacity-80 transition"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg font-bold shadow-sm transition disabled:opacity-50"
                  style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-text)' }}
                >
                  {saving ? 'Cargando archivo...' : 'Cargar Documento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
