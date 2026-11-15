import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CheckCircle2, Clock, FileEdit, Search, UserCheck } from 'lucide-react';
import api from '../services/api';
import type { Capitulo, Componente } from '../types';
import { getActivePlanId } from '../services/activePlan';

const statusClass: Record<string, string> = {
  Aprobado: 'text-emerald-600 dark:text-emerald-400',
  'En Revisión': 'text-purple-600 dark:text-purple-400',
  Observado: 'text-amber-600 dark:text-amber-400',
  Borrador: 'text-blue-600 dark:text-blue-400',
};

const statusIcon: Record<string, React.ReactNode> = {
  Aprobado: <CheckCircle2 className="w-3.5 h-3.5" />,
  'En Revisión': <Clock className="w-3.5 h-3.5" />,
  Borrador: <FileEdit className="w-3.5 h-3.5" />,
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

  if (loading) return <PageMessage text="Cargando capítulos y redactores..." />;
  if (error) return <PageMessage text={error} error />;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<BookOpen className="w-5 h-5 text-purple-500" />}
        title="Capítulos y Redacción"
        description="Consulta el estado de cada capítulo, sus redactores y accede a su gestión detallada."
      />

      <div className="p-4 rounded-2xl border flex flex-col md:flex-row gap-3"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
        <label className="flex items-center gap-2 flex-1 border rounded-xl px-3"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}>
          <Search className="w-4 h-4 opacity-50" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o componente..." className="bg-transparent outline-none text-xs w-full py-2" />
        </label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="border rounded-xl px-3 py-2 text-xs outline-none"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}>
          <option>Todos</option>
          <option>Borrador</option>
          <option>En Revisión</option>
          <option>Observado</option>
          <option>Aprobado</option>
        </select>
      </div>

      {capitulos.length === 0 ? (
        <PageMessage text="No existen capítulos que coincidan con los filtros seleccionados." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {capitulos.map((capitulo) => <ChapterCard key={capitulo.id} capitulo={capitulo} />)}
        </div>
      )}
    </div>
  );
};

const ChapterCard: React.FC<{ capitulo: Capitulo & { componente: Componente } }> = ({ capitulo }) => {
  const estado = capitulo.estado?.nombre || 'Borrador';
  return (
    <article className="p-5 rounded-2xl border shadow-sm space-y-4"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold opacity-60">Capítulo #{capitulo.numero}</span>
        <span className={`flex items-center gap-1 text-[11px] font-bold ${statusClass[estado] || statusClass.Borrador}`}>
          {statusIcon[estado] || <FileEdit className="w-3.5 h-3.5" />} {estado}
        </span>
      </div>
      <div>
        <h2 className="font-bold text-sm">{capitulo.titulo}</h2>
        <p className="text-xs opacity-60 mt-1">Componente #{capitulo.componente.numero}: {capitulo.componente.nombre}</p>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] opacity-70">
        <UserCheck className="w-3.5 h-3.5 text-blue-500" />
        {capitulo.redactores?.length
          ? capitulo.redactores.map((redactor) => redactor.nombreCompleto).join(', ')
          : 'Sin redactor asignado'}
      </div>
      <Link to={`/capitulos/${capitulo.id}`} className="flex items-center justify-end gap-1 text-xs font-semibold hover:underline"
        style={{ color: 'var(--primary)' }}>
        Gestionar capítulo <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </article>
  );
};

const PageHeader: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="p-6 rounded-2xl border shadow-sm" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-500">{icon} Módulo 2</div>
    <h1 className="text-xl font-extrabold tracking-tight mt-2">{title}</h1>
    <p className="text-xs opacity-60 mt-1">{description}</p>
  </div>
);

const PageMessage: React.FC<{ text: string; error?: boolean }> = ({ text, error }) => (
  <div className={`min-h-[40vh] flex items-center justify-center text-sm ${error ? 'text-rose-500' : 'opacity-60'}`}>{text}</div>
);
