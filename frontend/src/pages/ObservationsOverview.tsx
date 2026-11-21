import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Layers } from 'lucide-react';
import api from '../services/api';
import type { Capitulo, Componente, Observacion } from '../types';
import { getActivePlanId } from '../services/activePlan';
import { EmptyState } from '../components/common/EmptyState';

type ObservationRow = Observacion & { capitulo: Capitulo; componente: Componente };

export const ObservationsOverview: React.FC = () => {
  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [filter, setFilter] = useState<'pendientes' | 'todas'>('pendientes');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/planes/${getActivePlanId()}/componentes`)
      .then((res) => {
        if (res.data.success) setComponentes(res.data.componentes);
        else setError('No se pudieron cargar las observaciones técnicas.');
      })
      .catch(() => setError('No se pudieron cargar las observaciones técnicas.'))
      .finally(() => setLoading(false));
  }, []);

  const observaciones = useMemo<ObservationRow[]>(() => componentes.flatMap((componente) =>
    (componente.capitulos || []).flatMap((capitulo) =>
      (capitulo.observaciones || []).map((observacion) => ({ ...observacion, capitulo, componente }))
    )
  ).filter((observacion) => {
    const text = `${observacion.comentario} ${observacion.capitulo.titulo} ${observacion.componente.nombre}`.toLowerCase();
    return text.includes(search.toLowerCase()) && (filter === 'todas' || !observacion.resuelta);
  }), [componentes, filter, search]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-xs font-semibold text-slate-400 animate-pulse">
        Cargando observaciones técnicas del comité evaluador...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-xs font-bold text-rose-500">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Cabecera del Módulo */}
      <div 
        className="p-5 rounded-xl border shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4" 
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Módulo 2 • Control de Calidad
            </span>
            <span className="text-xs text-slate-400 font-medium">Comité Evaluador</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Bandeja de Observaciones Técnicas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Supervisa los comentarios emitidos por la comisión revisora y accede a cada capítulo para subsanar observaciones.
          </p>
        </div>

        <Link
          to="/capitulos"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300 self-start md:self-auto shrink-0"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <Layers className="w-3.5 h-3.5 text-sistemas-cyan" />
          <span>Ver Todos los Capítulos</span>
        </Link>
      </div>

      {/* 2. Barra de Filtros y Búsqueda */}
      <div 
        className="p-3 rounded-xl border flex flex-col md:flex-row gap-3 items-center justify-between shadow-2xs" 
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-2 flex-1 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Buscar por observación, redactor o capítulo..." 
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }} 
            />
          </div>

          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as 'pendientes' | 'todas')} 
            className="border rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
          >
            <option value="pendientes">Solo Pendientes</option>
            <option value="todas">Todas las Observaciones</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0">
          Mostrando <span className="font-bold text-slate-800 dark:text-slate-200">{observaciones.length}</span> observaciones
        </div>
      </div>

      {/* 3. Listado de Observaciones estilo Issues */}
      {observaciones.length === 0 ? (
        <EmptyState
          illustration={search.trim() ? 'search' : 'observations'}
          title={search.trim() ? 'Sin Coincidencias de Búsqueda' : 'Comité Técnico al Día'}
          description={
            search.trim() 
              ? `No se encontraron observaciones técnicas que coincidan con "${search}".` 
              : 'No se registran observaciones técnicas pendientes de subsanación para este plan curricular.'
          }
          actionLabel={search.trim() ? 'Limpiar Búsqueda' : undefined}
          onAction={search.trim() ? () => setSearch('') : undefined}
          className="border border-dashed rounded-xl"
        />
      ) : (
        <div className="space-y-3">
          {observaciones.map((observacion) => (
            <article 
              key={observacion.id} 
              className="p-4 rounded-xl border shadow-2xs space-y-3 transition hover:border-slate-400 dark:hover:border-slate-600" 
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-2" style={{ borderColor: 'var(--border-color)' }}>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Capítulo #{observacion.capitulo.numero}: {observacion.capitulo.titulo}
                  </span>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {observacion.componente.nombre} • Emitida el {new Date(observacion.created_at).toLocaleDateString('es-BO')}
                  </div>
                </div>

                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border self-start sm:self-auto ${
                  observacion.resuelta 
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' 
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${observacion.resuelta ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {observacion.resuelta ? 'Subsanada / Resuelta' : 'Pendiente de Subsanación'}
                </span>
              </div>

              <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                {observacion.comentario}
              </div>

              {observacion.respuesta_delegado && (
                <div 
                  className="p-2.5 rounded-lg border-l-3 border-l-emerald-500 text-xs text-slate-600 dark:text-slate-300"
                  style={{ backgroundColor: 'var(--bg-app)' }}
                >
                  <span className="font-bold text-[11px] text-emerald-600 dark:text-emerald-400 block mb-0.5">
                    Respuesta del Redactor / Delegado:
                  </span>
                  {observacion.respuesta_delegado}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <Link 
                  to={`/capitulos/${observacion.capitulo.id}`} 
                  className="inline-flex items-center gap-1 text-xs font-bold text-sistemas-cyan hover:underline"
                >
                  <span>Abrir Capítulo y Subsanar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
