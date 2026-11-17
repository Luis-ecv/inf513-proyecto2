import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Search } from 'lucide-react';
import api from '../services/api';
import type { Capitulo, Componente, Observacion } from '../types';
import { getActivePlanId } from '../services/activePlan';

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
        else setError('No se pudieron cargar las observaciones.');
      })
      .catch(() => setError('No se pudieron cargar las observaciones.'))
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

  if (loading) return <div className="min-h-[40vh] flex items-center justify-center text-sm opacity-60">Cargando observaciones técnicas...</div>;
  if (error) return <div className="min-h-[40vh] flex items-center justify-center text-sm text-rose-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl border shadow-sm" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500"><MessageSquare className="w-5 h-5" /> Módulo 2 • Seguimiento técnico</div>
        <h1 className="text-xl font-extrabold tracking-tight mt-2">Observaciones Técnicas</h1>
        <p className="text-xs opacity-60 mt-1">Revisa los comentarios emitidos sobre los capítulos y accede a cada capítulo para emitir o subsanar observaciones.</p>
      </div>

      <div className="p-4 rounded-2xl border flex flex-col md:flex-row gap-3" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
        <label className="flex items-center gap-2 flex-1 border rounded-xl px-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}>
          <Search className="w-4 h-4 opacity-50" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar observación o capítulo..." className="bg-transparent outline-none text-xs w-full py-2" />
        </label>
        <select value={filter} onChange={(e) => setFilter(e.target.value as 'pendientes' | 'todas')} className="border rounded-xl px-3 py-2 text-xs outline-none" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}>
          <option value="pendientes">Solo pendientes</option>
          <option value="todas">Todas</option>
        </select>
      </div>

      {observaciones.length === 0 ? <div className="text-center py-12 text-xs opacity-60 border border-dashed rounded-2xl" style={{ borderColor: 'var(--border-color)' }}>No hay observaciones para los filtros seleccionados.</div> : (
        <div className="space-y-3">
          {observaciones.map((observacion) => (
            <article key={observacion.id} className="p-5 rounded-2xl border shadow-sm" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <p className="text-xs font-bold">Capítulo #{observacion.capitulo.numero}: {observacion.capitulo.titulo}</p>
                  <p className="text-[11px] opacity-60 mt-1">{observacion.componente.nombre} · {new Date(observacion.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-[11px] font-bold ${observacion.resuelta ? 'text-emerald-600' : 'text-amber-600'}`}>{observacion.resuelta ? 'Resuelta' : 'Pendiente'}</span>
              </div>
              <p className="text-sm mt-4">{observacion.comentario}</p>
              {observacion.respuesta_delegado && <p className="text-xs opacity-70 mt-3 border-l-2 border-emerald-500 pl-3">Respuesta: {observacion.respuesta_delegado}</p>}
              <Link to={`/capitulos/${observacion.capitulo.id}`} className="inline-block text-xs font-semibold mt-4 hover:underline" style={{ color: 'var(--primary)' }}>Abrir capítulo →</Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
