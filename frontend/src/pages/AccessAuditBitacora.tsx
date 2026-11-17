import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import type { BitacoraEntry, RecursoMasAccedido } from '../types';
import {
  ShieldCheck, RotateCcw, Calendar, Filter,
  ArrowRight, Download,
} from 'lucide-react';

export const AccessAuditBitacora: React.FC = () => {
  const [entradas, setEntradas] = useState<BitacoraEntry[]>([]);
  const [recursosMasAccedidos, setRecursosMasAccedidos] = useState<RecursoMasAccedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipoEvento, setTipoEvento] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [mostrarRecursos, setMostrarRecursos] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRegistros, setTotalRegistros] = useState<number>(0);

  const cargarBitacora = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page };
      if (tipoEvento) {
        params.tipo_evento = tipoEvento;
      }
      if (fechaDesde) {
        params.fecha_desde = fechaDesde;
      }
      if (fechaHasta) {
        params.fecha_hasta = fechaHasta;
      }

      const res = await api.get('/bitacora', { params });
      if (res.data.success) {
        setEntradas(res.data.bitacora.data || []);
        setTotalPages(res.data.bitacora.last_page || 1);
        setTotalRegistros(res.data.bitacora.total || 0);
        setRecursosMasAccedidos(res.data.recursosMasAccedidos || []);
      }
    } catch (err) {
      console.error('Error al cargar bitácora:', err);
    } finally {
      setLoading(false);
    }
  }, [page, tipoEvento, fechaDesde, fechaHasta]);

  useEffect(() => {
    cargarBitacora();
  }, [cargarBitacora]);

  const handleFiltroCambio = (nuevoFiltro: string) => {
    setTipoEvento(nuevoFiltro);
    setMostrarRecursos(false);
    setPage(1);
  };

  const descargarBitacora = async () => {
    try {
      const params: Record<string, string> = {};
      if (tipoEvento) params.tipo_evento = tipoEvento;
      if (fechaDesde) params.fecha_desde = fechaDesde;
      if (fechaHasta) params.fecha_hasta = fechaHasta;

      const res = await api.get('/bitacora/exportar', {
        params,
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'bitacora-auditoria.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al descargar la bitácora:', err);
      window.alert('No se pudo descargar la bitácora con los filtros seleccionados.');
    }
  };

  const maxAcceso = recursosMasAccedidos.length > 0 ? recursosMasAccedidos[0].total_accesos : 1;

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-emerald-500" />
            <h1 className="text-2xl font-bold">Bitácora de Accesos y Seguridad</h1>
          </div>
        </div>
        <button
          onClick={cargarBitacora}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:opacity-80 transition-opacity"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualizar Registros
        </button>
      </div>

      {/* Registro principal de auditoría */}
      <div className="p-5 rounded-2xl border space-y-4"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold">Registro de Auditoría</h2>
            </div>

            {/* Selector de Filtros */}
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => { setFechaDesde(e.target.value); setPage(1); }}
                className="px-2 py-1 rounded-lg border"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                aria-label="Fecha desde"
              />
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => { setFechaHasta(e.target.value); setPage(1); }}
                className="px-2 py-1 rounded-lg border"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                aria-label="Fecha hasta"
              />
              <button
                onClick={descargarBitacora}
                className="px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 hover:opacity-80"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <Download className="w-3.5 h-3.5" /> Descargar CSV
              </button>
              <button
                onClick={() => handleFiltroCambio('')}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  tipoEvento === '' ? 'bg-primary text-white font-bold' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ borderColor: 'var(--border-color)' }}
              >
                Todos
              </button>
              <button
                onClick={() => handleFiltroCambio('login_exitoso')}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  tipoEvento === 'login_exitoso' ? 'bg-emerald-600 text-white font-bold' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ borderColor: 'var(--border-color)' }}
              >
                Logins OK
              </button>
              <button
                onClick={() => handleFiltroCambio('login_fallido')}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  tipoEvento === 'login_fallido' ? 'bg-rose-600 text-white font-bold' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ borderColor: 'var(--border-color)' }}
              >
                Fallidos
              </button>
              <button
                onClick={() => handleFiltroCambio('recurso_accedido')}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  tipoEvento === 'recurso_accedido' ? 'bg-blue-600 text-white font-bold' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ borderColor: 'var(--border-color)' }}
              >
                Endpoints
              </button>
              <button
                onClick={() => setMostrarRecursos(true)}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  mostrarRecursos ? 'bg-indigo-600 text-white font-bold' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ borderColor: 'var(--border-color)' }}
              >
                Recursos más consultados
              </button>
            </div>
          </div>

          {/* Tabla de Eventos */}
          {!mostrarRecursos && <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b opacity-60" style={{ borderColor: 'var(--border-color)' }}>
                  <th className="py-2.5 px-3">Fecha y Hora</th>
                  <th className="py-2.5 px-3">Usuario</th>
                  <th className="py-2.5 px-3">Dirección IP</th>
                  <th className="py-2.5 px-3">Ruta / Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center opacity-60">
                      Cargando registros de auditoría...
                    </td>
                  </tr>
                ) : entradas.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center opacity-50">
                      No se encontraron registros con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  entradas.map((entrada) => (
                    <tr key={entrada.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap opacity-75 flex items-center gap-1.5 font-mono text-[11px]">
                        <Calendar className="w-3.5 h-3.5 opacity-50" />
                        {new Date(entrada.fecha_hora).toLocaleString('es-BO', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {entrada.usuario ? (
                          <div>
                            <span className="font-semibold">{entrada.usuario.nombre_completo}</span>
                            <span className="block text-[10px] opacity-50">@{entrada.usuario.username}</span>
                          </div>
                        ) : (
                          <span className="italic opacity-50">Público / Anónimo</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] opacity-80">
                        {entrada.ip_address}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-mono text-[11px] max-w-[260px] truncate" title={entrada.recurso_accedido}>
                          <span className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-bold mr-1.5">
                            {entrada.metodo_http}
                          </span>
                          {entrada.recurso_accedido}
                        </div>
                        {entrada.detalle && (
                          <div className="text-[10px] opacity-60 truncate max-w-[260px] mt-0.5" title={entrada.detalle}>
                            {entrada.detalle}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>}

          {mostrarRecursos && (
            <div className="pt-2">
              <p className="text-[11px] opacity-60 mb-3">
                Rutas que registran más accesos en el sistema.
              </p>
              {recursosMasAccedidos.length === 0 ? (
                <p className="text-xs opacity-50 text-center py-4">Todavía no hay accesos registrados.</p>
              ) : (
                <ul className="space-y-2 text-xs">
                  {recursosMasAccedidos.map((rec, index) => {
                    const pct = Math.round((rec.total_accesos / maxAcceso) * 100);
                    return (
                      <li key={index} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-2 min-w-0">
                            <span className="text-[11px] opacity-50">{index + 1}.</span>
                            <span className="font-mono truncate" title={rec.recurso_accedido}>{rec.recurso_accedido}</span>
                          </span>
                          <span className="whitespace-nowrap font-semibold opacity-70">{rec.total_accesos} accesos</span>
                        </div>
                        <div className="w-full bg-black/5 dark:bg-white/5 rounded-full h-1 overflow-hidden">
                          <div className="bg-indigo-500 h-1 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center pt-3 border-t text-xs" style={{ borderColor: 'var(--border-color)' }}>
              <span className="opacity-60">
                Página {page} de {totalPages} ({totalRegistros} eventos)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1 rounded border disabled:opacity-30 hover:opacity-80"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  Anterior
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1 rounded border disabled:opacity-30 hover:opacity-80 flex items-center gap-1"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  Siguiente <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
    </div>
  );
};

