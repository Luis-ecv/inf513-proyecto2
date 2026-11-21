import React, { useEffect, useState } from 'react';
import api from '../services/api';
import type { Capitulo, Componente } from '../types';
import { 
  Layers, Plus, ArrowRight, X, AlertCircle, Trash2,
  BookOpen, ChevronDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getActivePlanId } from '../services/activePlan';
import { useAuth } from '../context/AuthContext';
import { EmptyState } from '../components/common/EmptyState';

export const RedesignOverview: React.FC = () => {
  const { user } = useAuth();
  const esInvitado = user?.rol?.toLowerCase() === 'invitado';
  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedComps, setCollapsedComps] = useState<Record<number, boolean>>({});

  const toggleCollapse = (id: number) => {
    setCollapsedComps(prev => ({ ...prev, [id]: !prev[id] }));
  };

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

  const confirmarEliminacion = (tipo: string, nombre: string) => {
    if (!window.confirm(`Paso 1 de 2: ¿Deseas eliminar ${tipo} "${nombre}"? Esta acción no se puede deshacer.`)) {
      return false;
    }

    const confirmacion = window.prompt(`Paso 2 de 2: escribe ELIMINAR para confirmar la eliminación de "${nombre}".`);
    return confirmacion?.trim().toUpperCase() === 'ELIMINAR';
  };

  const eliminarComponente = async (comp: Componente) => {
    if (!confirmarEliminacion('el componente', comp.nombre)) return;

    try {
      await api.delete(`/componentes/${comp.id}`);
      await fetchComponentes();
    } catch (err: any) {
      window.alert(err.response?.data?.message || 'No se pudo eliminar el componente.');
    }
  };

  const eliminarCapitulo = async (cap: Capitulo) => {
    if (!confirmarEliminacion('el capítulo', cap.titulo)) return;

    try {
      await api.delete(`/capitulos/${cap.id}`);
      await fetchComponentes();
    } catch (err: any) {
      window.alert(err.response?.data?.message || 'No se pudo eliminar el capítulo.');
    }
  };

  const getStatusBadge = (estadoNombre?: string) => {
    switch (estadoNombre) {
      case 'Aprobado':
        return (
          <span className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Aprobado
          </span>
        );
      case 'En Revisión':
        return (
          <span className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> En Revisión
          </span>
        );
      case 'Observado':
        return (
          <span className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Observado
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Borrador
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-xs font-semibold text-slate-400 animate-pulse flex items-center gap-2">
          <Layers className="w-4 h-4 animate-spin text-sistemas-cyan" />
          Cargando estructura y componentes del rediseño...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Cabecera del Módulo */}
      <div 
        className="p-5 rounded-xl border shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              Módulo 2 • Rediseño Curricular
            </span>
            <span className="text-xs text-slate-400 font-medium">Estructura Modular</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Estructura de Componentes y Capítulos Correlativos
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Distribución jerárquica de componentes curriculares, seguimiento por máquina de estados y control de redacción.
          </p>
        </div>

        {!esInvitado && (
          <button
            onClick={() => {
              setCompNumero(componentes.length + 1);
              setShowCompModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold shadow-xs transition bg-sky-500 hover:bg-sky-600 text-white self-start sm:self-auto shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Componente</span>
          </button>
        )}
      </div>

      {/* 2. Listado de Componentes y sus Capítulos */}
      <div className="space-y-4">
        {componentes.length === 0 ? (
          <EmptyState
            illustration="general"
            title="Sin componentes registrados"
            description="El marco de rediseño curricular no tiene componentes configurados todavía. Comienza creando el primero."
            actionLabel={!esInvitado ? 'Crear Primer Componente' : undefined}
            onAction={
              !esInvitado
                ? () => {
                    setCompNumero(1);
                    setShowCompModal(true);
                  }
                : undefined
            }
          />
        ) : (
          componentes.map((comp) => {
            const capitulos = comp.capitulos || [];
            const aprobados = capitulos.filter(c => c.estado?.nombre === 'Aprobado').length;
            const pct = capitulos.length > 0 ? Math.round((aprobados / capitulos.length) * 100) : 0;
            const isCollapsed = Boolean(collapsedComps[comp.id]);

            return (
              <div 
                key={comp.id}
                className="p-5 rounded-xl border shadow-xs space-y-3.5 transition"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
              >
                <div 
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b gap-3" 
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <div className="flex items-start gap-2.5">
                    <button
                      type="button"
                      onClick={() => toggleCollapse(comp.id)}
                      className="mt-0.5 p-1 rounded-md border text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                      style={{ borderColor: 'var(--border-color)' }}
                      title={isCollapsed ? 'Expandir capítulos' : 'Plegar capítulos'}
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span 
                          className="text-xs font-mono font-bold px-2 py-0.5 rounded border text-sistemas-cyan" 
                          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
                        >
                          Componente #{comp.numero}
                        </span>
                        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">{comp.nombre}</h2>
                      </div>
                      {comp.descripcion && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl font-medium">{comp.descripcion}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right text-xs">
                      <span className="text-slate-400">Avance:</span> <span className="font-bold text-sistemas-cyan">{pct}%</span>
                      <div className="text-[10px] text-slate-400">{aprobados} de {capitulos.length} aprobados</div>
                    </div>

                    {!esInvitado && (
                      <button
                        onClick={() => {
                          setSelectedCompId(comp.id);
                          setChapNumero(capitulos.length + 1);
                          setShowChapterModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300"
                        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}
                      >
                        <Plus className="w-3.5 h-3.5 text-sky-500" />
                        <span>Añadir Capítulo</span>
                      </button>
                    )}

                    {!esInvitado && (
                      <button
                        onClick={() => eliminarComponente(comp)}
                        className="p-1.5 rounded-lg border hover:bg-rose-500/10 transition text-slate-400 hover:text-rose-500"
                        style={{ borderColor: 'var(--border-color)' }}
                        title="Eliminar este componente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-lista de Capítulos de este Componente */}
                {!isCollapsed && (
                  capitulos.length === 0 ? (
                    <div 
                      className="text-center py-6 text-xs text-slate-400 border border-dashed rounded-lg"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      Este componente no tiene capítulos asignados todavía.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {capitulos.map((cap) => (
                        <div
                          key={cap.id}
                          className="p-3 rounded-lg border shadow-2xs space-y-2 flex flex-col justify-between transition hover:border-slate-400 dark:hover:border-slate-600"
                          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-mono font-bold text-[11px] text-slate-500">
                                Cap. #{cap.numero}
                              </span>
                              {getStatusBadge(cap.estado?.nombre)}
                            </div>

                            <h3 className="font-bold text-xs leading-snug text-slate-800 dark:text-slate-100 line-clamp-2" title={cap.titulo}>
                              {cap.titulo}
                            </h3>
                          </div>

                          <div className="pt-2 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border-color)' }}>
                            <Link 
                              to={`/capitulos/${cap.id}`} 
                              className="inline-flex items-center gap-1 text-xs font-bold text-sistemas-cyan hover:underline"
                            >
                              <span>Gestionar</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>

                            {!esInvitado && (
                              <button
                                onClick={() => eliminarCapitulo(cap)}
                                className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                                title="Eliminar capítulo"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 3. Modal de Nuevo Componente */}
      {showCompModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            className="w-full max-w-md p-6 rounded-xl border shadow-2xl relative"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
          >
            <button 
              onClick={() => setShowCompModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-sm font-bold flex items-center gap-2 mb-1 text-slate-900 dark:text-white">
              <Layers className="w-4 h-4 text-sky-500" /> Registrar Nuevo Componente
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Los componentes agrupan capítulos correlativos del documento de rediseño curricular.
            </p>

            {compError && (
              <div className="mb-4 p-3 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{compError}</span>
              </div>
            )}

            <form onSubmit={handleCrearComponente} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Número Correlativo:</label>
                <input
                  type="number"
                  min="1"
                  value={compNumero}
                  onChange={(e) => setCompNumero(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Nombre del Componente:</label>
                <input
                  type="text"
                  value={compNombre}
                  onChange={(e) => setCompNombre(e.target.value)}
                  placeholder="ej: Marco Doctrinal e Institucional"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Descripción / Alcance:</label>
                <textarea
                  value={compDesc}
                  onChange={(e) => setCompDesc(e.target.value)}
                  placeholder="Descripción de los contenidos requeridos..."
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none font-medium"
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setShowCompModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition font-semibold text-slate-700 dark:text-slate-300"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingComp}
                  className="px-4 py-2 rounded-lg font-bold shadow-xs transition disabled:opacity-50 bg-sky-500 hover:bg-sky-600 text-white"
                >
                  {savingComp ? 'Guardando...' : 'Crear Componente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal de Nuevo Capítulo */}
      {showChapterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            className="w-full max-w-lg p-6 rounded-xl border shadow-2xl relative"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
          >
            <button 
              onClick={() => setShowChapterModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-sm font-bold flex items-center gap-2 mb-1 text-slate-900 dark:text-white">
              <BookOpen className="w-4 h-4 text-sky-500" /> Registrar Nuevo Capítulo
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              El capítulo se inicializará en estado "Borrador" para asignación de redactores.
            </p>

            {chapError && (
              <div className="mb-4 p-3 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{chapError}</span>
              </div>
            )}

            <form onSubmit={handleCrearCapitulo} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Número Correlativo del Capítulo:</label>
                <input
                  type="number"
                  min="1"
                  value={chapNumero}
                  onChange={(e) => setChapNumero(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Título Oficial del Capítulo:</label>
                <input
                  type="text"
                  value={chapTitulo}
                  onChange={(e) => setChapTitulo(e.target.value)}
                  placeholder="ej: Fundamentación Filosófica y Epistemológica"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Contenido Inicial / Directrices:</label>
                <textarea
                  value={chapContenido}
                  onChange={(e) => setChapContenido(e.target.value)}
                  placeholder="Directrices para los redactores..."
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none font-medium"
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setShowChapterModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition font-semibold text-slate-700 dark:text-slate-300"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingChap}
                  className="px-4 py-2 rounded-lg font-bold shadow-xs transition disabled:opacity-50 bg-sky-500 hover:bg-sky-600 text-white"
                >
                  {savingChap ? 'Guardando...' : 'Crear Capítulo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
