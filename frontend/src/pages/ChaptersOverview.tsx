import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, CheckCircle2, Clock, 
  FileEdit, Search, UserCheck, AlertTriangle, Layers
} from 'lucide-react';
import api from '../services/api';
import type { Capitulo, Componente } from '../types';
import { getActivePlanId } from '../services/activePlan';

const statusConfig: Record<string, { label: string; dotClass: string; badgeClass: string; icon: React.ReactNode }> = {
  Aprobado: {
    label: 'Aprobado',
    dotClass: 'bg-emerald-500',
    badgeClass: 'text-emerald-700 bg-emerald-500/10 border-emerald-500/30 dark:text-emerald-300',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
  },
  'En Revisión': {
    label: 'En Revisión',
    dotClass: 'bg-purple-500',
    badgeClass: 'text-purple-700 bg-purple-500/10 border-purple-500/30 dark:text-purple-300',
    icon: <Clock className="w-3.5 h-3.5 text-purple-500" />,
  },
  Observado: {
    label: 'Observado',
    dotClass: 'bg-amber-500',
    badgeClass: 'text-amber-700 bg-amber-500/10 border-amber-500/30 dark:text-amber-300',
    icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
  },
  Borrador: {
    label: 'Borrador',
    dotClass: 'bg-blue-500',
    badgeClass: 'text-blue-700 bg-blue-500/10 border-blue-500/30 dark:text-blue-300',
    icon: <FileEdit className="w-3.5 h-3.5 text-blue-500" />,
  },
};

export const ChaptersOverview: React.FC = () => {
  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/planes/${getActivePlanId()}/componentes`)
      .then((res) => {
        if (res.data.success) setComponentes(res.data.componentes);
        else setError('No se pudo cargar la lista de capítulos.');
      })
      .catch(() => setError('No se pudo cargar la lista de capítulos.'))
      .finally(() => setLoading(false));
  }, []);

  const capitulos = useMemo(() => componentes.flatMap((componente) =>
    (componente.capitulos || []).map((capitulo) => ({ ...capitulo, componente }))
  ).filter((capitulo) => {
    const text = `${capitulo.titulo} ${capitulo.componente.nombre}`.toLowerCase();
    return text.includes(search.toLowerCase()) &&
      (status === 'Todos' || capitulo.estado?.nombre === status);
  }), [componentes, search, status]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-xs font-semibold text-slate-400 animate-pulse">
        Cargando capítulos y redactores asignados...
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
      {/* Cabecera del Módulo */}
      <div 
        className="p-5 rounded-xl border shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              Módulo 2 • Redacción Técnica
            </span>
            <span className="text-xs text-slate-400 font-medium">Documentación Oficial</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Capítulos del Rediseño Curricular
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Supervisa el estado de redacción, control de versiones de documentos y gestión de observaciones por capítulo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/observaciones"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <span>Ver Observaciones</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
          <Link
            to="/redisenio"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition bg-sky-500 hover:bg-sky-600 text-white"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Estructura de Componentes</span>
          </Link>
        </div>
      </div>

      {/* Barra de Filtros */}
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
              placeholder="Buscar por título de capítulo o componente..." 
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
            />
          </div>

          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
          >
            <option value="Todos">Todos los Estados</option>
            <option value="Borrador">Borrador</option>
            <option value="En Revisión">En Revisión</option>
            <option value="Observado">Observado</option>
            <option value="Aprobado">Aprobado</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0">
          Mostrando <span className="font-bold text-slate-800 dark:text-slate-200">{capitulos.length}</span> capítulos
        </div>
      </div>

      {/* Cuadrícula de Tarjetas de Capítulo */}
      {capitulos.length === 0 ? (
        <div 
          className="text-center py-12 text-xs text-slate-400 border border-dashed rounded-xl"
          style={{ borderColor: 'var(--border-color)' }}
        >
          No existen capítulos que coincidan con los criterios de búsqueda seleccionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {capitulos.map((capitulo) => (
            <ChapterCard key={capitulo.id} capitulo={capitulo} />
          ))}
        </div>
      )}
    </div>
  );
};

const ChapterCard: React.FC<{ capitulo: Capitulo & { componente: Componente } }> = ({ capitulo }) => {
  const estadoNombre = capitulo.estado?.nombre || 'Borrador';
  const cfg = statusConfig[estadoNombre] || statusConfig.Borrador;

  return (
    <article 
      className="p-4 rounded-xl border shadow-2xs space-y-3 flex flex-col justify-between transition hover:border-slate-400 dark:hover:border-slate-600"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span 
            className="text-[11px] font-mono font-bold px-2 py-0.5 rounded border text-slate-600 dark:text-slate-300"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
          >
            Capítulo #{capitulo.numero}
          </span>
          <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.badgeClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
            {estadoNombre}
          </span>
        </div>

        <div>
          <h2 className="font-bold text-xs leading-snug text-slate-800 dark:text-slate-100 line-clamp-2" title={capitulo.titulo}>
            {capitulo.titulo}
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium truncate" title={capitulo.componente.nombre}>
            Componente #{capitulo.componente.numero}: {capitulo.componente.nombre}
          </p>
        </div>
      </div>

      <div className="pt-2.5 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[170px]" title={capitulo.redactores?.map(r => r.nombreCompleto).join(', ')}>
          <UserCheck className="w-3.5 h-3.5 text-sistemas-cyan shrink-0" />
          <span className="truncate">
            {capitulo.redactores?.length
              ? capitulo.redactores.map((r) => r.nombreCompleto).join(', ')
              : 'Sin redactor asignado'}
          </span>
        </div>

        <Link 
          to={`/capitulos/${capitulo.id}`} 
          className="flex items-center gap-1 text-xs font-bold text-sistemas-cyan hover:underline shrink-0"
        >
          Gestionar <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </article>
  );
};
