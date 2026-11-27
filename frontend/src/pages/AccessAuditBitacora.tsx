import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import type { BitacoraEntry, RecursoMasAccedido } from '../types';
import {
  ShieldCheck, RotateCcw, Calendar, Filter,
  ArrowRight, Download, ArrowLeft, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

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

  const getEventoBadge = (tipo: string) => {
    switch (tipo) {
      case 'login_exitoso':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Login OK
          </span>
        );
      case 'login_fallido':
      case 'bloqueo_fuerza_bruta':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3 h-3" /> {tipo === 'bloqueo_fuerza_bruta' ? 'Fuerza Bruta' : 'Fallido'}
          </span>
        );
      case 'recurso_accedido':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            Endpoint
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Encabezado Principal */}
      <div 
        className="p-5 rounded-xl border shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
              Módulo 5 • Seguridad y Auditoría
            </span>
            <span className="text-xs text-slate-400 font-medium">Trazabilidad Inmutable (ADR-005)</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>Bitácora de Accesos y Seguridad</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Registro cronológico inalterable de inicios de sesión, intentos denegados y eventos del sistema.
          </p>
        </div>

        <button
          onClick={cargarBitacora}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-slate-700 dark:text-slate-300 shrink-0"
          style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sistemas-cyan' : ''}`} />
          Actualizar Registros
        </button>
      </div>

      {/* 2. Registro principal de auditoría */}
      <div 
        className="p-4 sm:p-5 rounded-xl border shadow-xs space-y-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-sistemas-cyan shrink-0" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Filtros de Trazabilidad
            </h2>
          </div>

          {/* Selector de Filtros y Rango de Fechas */}
          <div className="flex flex-wrap items-center gap-2 text-xs w-full lg:w-auto">
            <div className="flex items-center gap-1.5 flex-wrap">
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => { setFechaDesde(e.target.value); setPage(1); }}
                className="px-2.5 py-1 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                aria-label="Fecha desde"
              />
              <span className="text-slate-400 text-xs">a</span>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => { setFechaHasta(e.target.value); setPage(1); }}
                className="px-2.5 py-1 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                aria-label="Fecha hasta"
              />
            </div>

            <button
              onClick={descargarBitacora}
              className="px-3 py-1 rounded-lg border font-semibold flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-slate-700 dark:text-slate-300 shrink-0"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
            >
              <Download className="w-3.5 h-3.5" /> Exportar CSV
            </button>

            <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
              <button
                onClick={() => handleFiltroCambio('')}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                  tipoEvento === '' && !mostrarRecursos
                    ? 'bg-sky-500 text-white shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => handleFiltroCambio('login_exitoso')}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                  tipoEvento === 'login_exitoso' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Logins OK
              </button>
              <button
                onClick={() => handleFiltroCambio('login_fallido')}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                  tipoEvento === 'login_fallido' 
                    ? 'bg-rose-600 text-white shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Fallidos
              </button>
              <button
                onClick={() => handleFiltroCambio('recurso_accedido')}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                  tipoEvento === 'recurso_accedido' 
                    ? 'bg-sky-600 text-white shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Endpoints
              </button>
              <button
                onClick={() => setMostrarRecursos(true)}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                  mostrarRecursos 
                    ? 'bg-purple-600 text-white shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Top Recursos
              </button>
            </div>
          </div>
        </div>

        {/* 3. Tabla de Eventos */}
        {!mostrarRecursos && (
          <div className="overflow-x-auto pt-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider" style={{ borderColor: 'var(--border-color)' }}>
                  <th className="py-3 px-3.5">Fecha y Hora</th>
                  <th className="py-3 px-3.5">Evento</th>
                  <th className="py-3 px-3.5">Usuario</th>
                  <th className="py-3 px-3.5">Dirección IP</th>
                  <th className="py-3 px-3.5">Ruta / Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs" style={{ borderColor: 'var(--border-color)' }}>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400">
                      <RotateCcw className="w-4 h-4 animate-spin inline-block mr-2 text-sistemas-cyan" />
                      Cargando registros de auditoría institucional...
                    </td>
                  </tr>
                ) : entradas.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6">
                      <EmptyState
                        illustration="audit"
                        title="Sin Registros de Auditoría"
                        description="No existen eventos de acceso ni bloqueos registrados con los filtros de fecha o tipo seleccionados."
                        actionLabel={tipoEvento || fechaDesde || fechaHasta ? "Limpiar Filtros" : undefined}
                        onAction={() => { setTipoEvento(''); setFechaDesde(''); setFechaHasta(''); setPage(1); }}
                      />
                    </td>
                  </tr>
                ) : (
                  entradas.map((entrada) => (
                    <tr key={entrada.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(entrada.fecha_hora).toLocaleString('es-BO', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {getEventoBadge(entrada.tipo_evento)}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {entrada.usuario ? (
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white text-xs">{entrada.usuario.nombre_completo}</span>
                            <span className="block text-[11px] text-slate-400 font-mono">@{entrada.usuario.username}</span>
                          </div>
                        ) : (
                          <span className="italic text-slate-400 text-xs">Público / Anónimo</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap font-mono text-xs text-slate-600 dark:text-slate-300">
                        {entrada.ip_address}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-mono text-xs max-w-[320px] truncate text-slate-800 dark:text-slate-200" title={entrada.recurso_accedido}>
                          {entrada.metodo_http && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold mr-1.5 text-slate-700 dark:text-slate-300 text-[11px]">
                              {entrada.metodo_http}
                            </span>
                          )}
                          {entrada.recurso_accedido}
                        </div>
                        {entrada.detalle && (
                          <div className="text-[11px] text-slate-400 truncate max-w-[320px] mt-0.5" title={entrada.detalle}>
                            {entrada.detalle}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Top Recursos Más Consultados */}
        {mostrarRecursos && (
          <div className="pt-2">
            <p className="text-[11px] text-slate-400 mb-3">
              Rutas y endpoints que registran mayor volumen de tráfico en el sistema.
            </p>
            {recursosMasAccedidos.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Todavía no hay accesos registrados.</p>
            ) : (
              <ul className="space-y-2.5 text-xs">
                {recursosMasAccedidos.map((rec, index) => {
                  const pct = Math.round((rec.total_accesos / maxAcceso) * 100);
                  return (
                    <li 
                      key={index} 
                      className="p-3 rounded-lg border space-y-1.5"
                      style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="text-[11px] font-bold text-slate-400 font-mono">{index + 1}.</span>
                          <span className="font-mono text-xs text-slate-900 dark:text-white truncate" title={rec.recurso_accedido}>
                            {rec.recurso_accedido}
                          </span>
                        </span>
                        <span className="whitespace-nowrap font-semibold text-sky-600 dark:text-sky-400 font-mono text-xs">
                          {rec.total_accesos} accesos
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="h-1.5 rounded-full transition-all duration-500" 
                          style={{ width: `${pct}%`, backgroundColor: '#009fe3' }} 
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* 5. Paginación */}
        {totalPages > 1 && !mostrarRecursos && (
          <div className="flex justify-between items-center pt-3 border-t text-xs text-slate-500 dark:text-slate-400" style={{ borderColor: 'var(--border-color)' }}>
            <span>
              Página {page} de {totalPages} ({totalRegistros} eventos registrados)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 rounded-lg border disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
              >
                <ArrowLeft className="w-3 h-3" /> Anterior
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 rounded-lg border disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
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
