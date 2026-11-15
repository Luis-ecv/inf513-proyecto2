import React, { useEffect, useState } from 'react';
import api from '../services/api';
import type { Componente } from '../types';
import { 
  Layers, Plus, ArrowRight, UserCheck, CheckCircle2, 
  Clock, AlertTriangle, FileEdit, X, AlertCircle 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getActivePlanId } from '../services/activePlan';

export const RedesignOverview: React.FC = () => {
  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal para nuevo capítulo (RF-05)
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [selectedCompId, setSelectedCompId] = useState<number | null>(null);
  const [chapNumero, setChapNumero] = useState<number>(1);
  const [chapTitulo, setChapTitulo] = useState('');
  const [chapContenido, setChapContenido] = useState('');
  const [savingChap, setSavingChap] = useState(false);
  const [chapError, setChapError] = useState('');

  // Modal para nuevo componente
  const [showCompModal, setShowCompModal] = useState(false);
  const [compNumero, setCompNumero] = useState<number>(1);
  const [compNombre, setCompNombre] = useState('');
  const [compDesc, setCompDesc] = useState('');
  const [savingComp, setSavingComp] = useState(false);
  const [compError, setCompError] = useState('');

  const fetchComponentes = async () => {
    try {
      const res = await api.get(`/planes/${getActivePlanId()}/componentes`);
      if (res.data.success) {
        setComponentes(res.data.componentes);
      }
    } catch (err) {
      console.error('Error al cargar estructura del rediseño:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComponentes();
  }, []);

  const handleCrearCapitulo = async (e: React.FormEvent) => {
    e.preventDefault();
    setChapError('');

    if (!chapTitulo.trim() || !selectedCompId) {
      setChapError('El título del capítulo y el componente son obligatorios.');
      return;
    }

    setSavingChap(true);
    try {
      const res = await api.post('/capitulos', {
        numero: chapNumero,
        titulo: chapTitulo.trim(),
        contenido: chapContenido.trim(),
        id_componente: selectedCompId,
      });

      if (res.data.success) {
        setShowChapterModal(false);
        setChapTitulo('');
        setChapContenido('');
        await fetchComponentes();
      }
    } catch (err: any) {
      setChapError(err.response?.data?.message || 'Error al registrar capítulo.');
    } finally {
      setSavingChap(false);
    }
  };

  const handleCrearComponente = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompError('');

    if (!compNombre.trim()) {
      setCompError('El nombre del componente es obligatorio.');
      return;
    }

    setSavingComp(true);
    try {
      const res = await api.post('/componentes', {
        numero: compNumero,
        nombre: compNombre.trim(),
        descripcion: compDesc.trim(),
        id_plan_estudio: getActivePlanId(),
      });

      if (res.data.success) {
        setShowCompModal(false);
        setCompNombre('');
        setCompDesc('');
        await fetchComponentes();
      }
    } catch (err: any) {
      setCompError(err.response?.data?.message || 'Error al registrar componente.');
    } finally {
      setSavingComp(false);
    }
  };

  const getStatusBadge = (estadoNombre?: string) => {
    switch (estadoNombre) {
      case 'Aprobado':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Aprobado
          </span>
        );
      case 'En Revisión':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Clock className="w-3 h-3" /> En Revisión
          </span>
        );
      case 'Observado':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" /> Observado
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <FileEdit className="w-3 h-3" /> Borrador
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-sm opacity-60">Cargando avance del rediseño...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabecera del Módulo 2 (CU4, RF-05) */}
      <div 
        className="p-6 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-purple-500/10 text-purple-500 border border-purple-500/20">
              Módulo 2 • Rediseño Curricular
            </span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight mt-1">
            Estructura de Componentes y Capítulos Correlativos
          </h1>
          <p className="text-xs opacity-60 mt-0.5">
            Distribución de responsabilidades, seguimiento por máquina de estados y auditoría inmutable.
          </p>
        </div>

        <button
          onClick={() => {
            setCompNumero(componentes.length + 1);
            setShowCompModal(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition self-start sm:self-auto"
          style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-text)' }}
        >
          <Plus className="w-4 h-4" /> Nuevo Componente
        </button>
      </div>

      {/* Componentes y Capítulos */}
      <div className="space-y-6">
        {componentes.map((comp) => {
          const capitulos = comp.capitulos || [];
          const aprobados = capitulos.filter(c => c.estado?.nombre === 'Aprobado').length;
          const pct = capitulos.length > 0 ? Math.round((aprobados / capitulos.length) * 100) : 0;

          return (
            <div 
              key={comp.id}
              className="p-6 rounded-2xl border shadow-sm space-y-4 transition"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b gap-3" style={{ borderColor: 'var(--border-color)' }}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}>
                      Componente #{comp.numero}
                    </span>
                    <h2 className="text-base font-bold">{comp.nombre}</h2>
                  </div>
                  {comp.descripcion && (
                    <p className="text-xs opacity-60 mt-1 max-w-2xl">{comp.descripcion}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right text-xs">
                    <span className="opacity-60">Cumplimiento:</span> <span className="font-bold">{pct}%</span>
                    <div className="text-[10px] opacity-50">{aprobados} de {capitulos.length} aprobados</div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCompId(comp.id);
                      setChapNumero(capitulos.length + 1);
                      setShowChapterModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium hover:opacity-80 transition"
                    style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Capítulo
                  </button>
                </div>
              </div>

              {/* Lista de Capítulos del Componente */}
              {capitulos.length === 0 ? (
                <div className="text-center py-6 text-xs opacity-50 border border-dashed rounded-xl" style={{ borderColor: 'var(--border-color)' }}>
                  Aún no se han redactado capítulos dentro de este componente temático.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {capitulos.map((cap) => (
                    <div
                      key={cap.id}
                      className="p-4 rounded-xl border shadow-xs flex flex-col justify-between space-y-3 transition hover:shadow-md"
                      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-bold opacity-60">Capítulo #{cap.numero}</span>
                          {getStatusBadge(cap.estado?.nombre)}
                        </div>

                        <h3 className="font-bold text-sm leading-snug line-clamp-2">
                          {cap.titulo}
                        </h3>

                        {/* Redactores Asignados */}
                        <div className="flex items-center gap-1.5 mt-2.5 text-[11px] opacity-70">
                          <UserCheck className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                          <span className="truncate">
                            {cap.redactores && cap.redactores.length > 0
                              ? cap.redactores.map(r => r.nombreCompleto).join(', ')
                              : 'Sin redactor asignado'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t flex justify-end" style={{ borderColor: 'var(--border-color)' }}>
                        <Link
                          to={`/capitulos/${cap.id}`}
                          className="flex items-center gap-1 text-xs font-semibold hover:underline"
                          style={{ color: 'var(--primary)' }}
                        >
                          Gestionar Capítulo <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal para Crear Capítulo (RF-05) */}
      {showChapterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div 
            className="w-full max-w-lg p-6 rounded-2xl border shadow-2xl relative"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
          >
            <button 
              onClick={() => setShowChapterModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border hover:opacity-80 transition"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-base font-bold flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-purple-500" /> Registrar Capítulo Correlativo
            </h2>
            <p className="text-xs opacity-60 mb-4">
              El capítulo se iniciará en estado 'Borrador' para su posterior asignación y revisión.
            </p>

            {chapError && (
              <div className="mb-4 p-3 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{chapError}</span>
              </div>
            )}

            <form onSubmit={handleCrearCapitulo} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Número Correlativo:</label>
                  <input
                    type="number"
                    min="1"
                    value={chapNumero}
                    onChange={(e) => setChapNumero(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold mb-1">Componente Temático:</label>
                  <select
                    value={selectedCompId || ''}
                    onChange={(e) => setSelectedCompId(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                    required
                  >
                    {componentes.map(c => (
                      <option key={c.id} value={c.id}>Comp. #{c.numero}: {c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Título del Capítulo:</label>
                <input
                  type="text"
                  value={chapTitulo}
                  onChange={(e) => setChapTitulo(e.target.value)}
                  placeholder="ej: Modelo Pedagógico y Metodología de Enseñanza"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Contenido Preliminar (Borrador):</label>
                <textarea
                  rows={4}
                  value={chapContenido}
                  onChange={(e) => setChapContenido(e.target.value)}
                  placeholder="Redacta o pega el contenido base del capítulo..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setShowChapterModal(false)}
                  className="px-4 py-2 border rounded-lg hover:opacity-80 transition"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingChap}
                  className="px-4 py-2 rounded-lg font-bold shadow-sm transition disabled:opacity-50"
                  style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-text)' }}
                >
                  {savingChap ? 'Guardando...' : 'Guardar Capítulo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Crear Componente */}
      {showCompModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div 
            className="w-full max-w-md p-6 rounded-2xl border shadow-2xl relative"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
          >
            <button 
              onClick={() => setShowCompModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border hover:opacity-80 transition"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-base font-bold flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-purple-500" /> Registrar Componente Temático
            </h2>
            <p className="text-xs opacity-60 mb-4">
              Sección estructural mayor del documento curricular.
            </p>

            {compError && (
              <div className="mb-4 p-3 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{compError}</span>
              </div>
            )}

            <form onSubmit={handleCrearComponente} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">Número de Componente:</label>
                <input
                  type="number"
                  min="1"
                  value={compNumero}
                  onChange={(e) => setCompNumero(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Nombre del Componente:</label>
                <input
                  type="text"
                  value={compNombre}
                  onChange={(e) => setCompNombre(e.target.value)}
                  placeholder="ej: Componente de Infraestructura y Equipamiento"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Descripción / Alcance:</label>
                <textarea
                  rows={3}
                  value={compDesc}
                  onChange={(e) => setCompDesc(e.target.value)}
                  placeholder="Objetivos o alcance temático de esta sección..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setShowCompModal(false)}
                  className="px-4 py-2 border rounded-lg hover:opacity-80 transition"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingComp}
                  className="px-4 py-2 rounded-lg font-bold shadow-sm transition disabled:opacity-50"
                  style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-text)' }}
                >
                  {savingComp ? 'Guardando...' : 'Guardar Componente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

