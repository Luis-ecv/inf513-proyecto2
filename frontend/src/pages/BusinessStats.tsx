import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import type { PlanEstudio, ComponenteStat, ProductividadUsuario } from '../types';
import { 
  BarChart3, Layers, CheckCircle2, 
  MessageSquare, RefreshCw, UserCheck, 
  Award
} from 'lucide-react';
import { getActivePlanId } from '../services/activePlan';

export const BusinessStats: React.FC = () => {
  const [planes, setPlanes] = useState<PlanEstudio[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number>(() => getActivePlanId());
  const [componentesStats, setComponentesStats] = useState<ComponenteStat[]>([]);
  const [productividad, setProductividad] = useState<ProductividadUsuario[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar lista de planes
  useEffect(() => {
    const cargarPlanes = async () => {
      try {
        const res = await api.get('/planes');
        if (res.data.success && res.data.planes.length > 0) {
          setPlanes(res.data.planes);
          const currentActive = getActivePlanId();
          const exists = res.data.planes.some((p: PlanEstudio) => p.id === currentActive);
          if (!exists) {
            setSelectedPlanId(res.data.planes[0].id);
          }
        }
      } catch (err) {
        console.error('Error al cargar planes:', err);
      }
    };
    cargarPlanes();
  }, []);

  const cargarEstadisticas = useCallback(async () => {
    if (!selectedPlanId) return;
    setLoading(true);
    try {
      const [resComp, resProd] = await Promise.all([
        api.get(`/dashboard/planes/${selectedPlanId}/componentes`),
        api.get('/dashboard/productividad'),
      ]);

      if (resComp.data.success) {
        setComponentesStats(resComp.data.componentes || []);
      }
      if (resProd.data.success) {
        setProductividad(resProd.data.productividad || []);
      }
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedPlanId]);

  useEffect(() => {
    cargarEstadisticas();
  }, [cargarEstadisticas]);

  // Cálculos agregados
  const totalCapitulos = componentesStats.reduce((acc, c) => acc + c.totalCapitulos, 0);
  const totalAprobados = componentesStats.reduce((acc, c) => acc + c.aprobados, 0);
  const totalObservados = componentesStats.reduce((acc, c) => acc + c.observados, 0);
  const porcentajeGlobal = totalCapitulos > 0
    ? Math.min(100, Math.max(0, Math.round((Number(totalAprobados) / Number(totalCapitulos)) * 100)))
    : 0;

  const totalObsEmitidas = productividad.reduce((acc, p) => acc + p.observacionesEmitidas, 0);
  const totalObsSubsanadas = productividad.reduce((acc, p) => acc + p.observacionesSubsanadas, 0);

  return (
    <div className="space-y-4">
      {/* 1. Encabezado y Filtro de Plan */}
      <div 
        className="p-5 rounded-xl border shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              Módulo 4 • Métricas de Avance
            </span>
            <span className="text-xs text-slate-400 font-medium">Salud del Rediseño Curricular</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sistemas-cyan" />
            Estadísticas del Negocio Curricular
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Métricas de cumplimiento por componente temático, índice de subsanaciones y productividad docente.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Selector de Plan */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Plan:</span>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500"
              style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
            >
              {planes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo} - {p.carrera}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={cargarEstadisticas}
            className="p-2 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-slate-600 dark:text-slate-300"
            style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
            title="Recargar estadísticas"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sistemas-cyan' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Tarjetas Resumen Ejecutivo (CU8, RF-09) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Avance Curricular Oficial */}
        <div 
          className="p-4 rounded-xl border shadow-xs"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Avance Curricular Oficial</span>
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400 font-mono">{porcentajeGlobal}%</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalAprobados} <span className="text-xs font-semibold text-slate-400">/ {totalCapitulos} caps</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mt-2.5">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${porcentajeGlobal}%`, backgroundColor: '#009fe3' }}
            />
          </div>
          <div className="text-[10px] text-slate-400 mt-2">Capítulos aprobados formalmente</div>
        </div>

        {/* Capítulos con Observaciones */}
        <div 
          className="p-4 rounded-xl border shadow-xs flex items-center justify-between"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
        >
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Capítulos Observados</div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{totalObservados}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Requieren subsanación técnica</div>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        {/* Observaciones Técnicas Emitidas / Subsanadas */}
        <div 
          className="p-4 rounded-xl border shadow-xs flex items-center justify-between"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
        >
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Observaciones Totales</div>
            <div className="text-2xl font-black text-amber-500 mt-1">{totalObsEmitidas}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {totalObsSubsanadas} subsanadas ({totalObsEmitidas > 0 ? Math.round((totalObsSubsanadas / totalObsEmitidas) * 100) : 0}%)
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Comité de Rediseño */}
        <div 
          className="p-4 rounded-xl border shadow-xs flex items-center justify-between"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
        >
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Comité de Rediseño</div>
            <div className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">{productividad.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Docentes y delegados registrados</div>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-sky-500/10 text-sky-500 border border-sky-500/20">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Grid: Cumplimiento por Componente Temático & Productividad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cumplimiento por Componente Curricular */}
        <div 
          className="p-5 rounded-xl border shadow-xs space-y-4"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sistemas-cyan" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Avance por Componente Curricular
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {componentesStats.length} bloques temáticos
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {componentesStats.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-6">
                No hay componentes registrados para este plan.
              </div>
            ) : (
              componentesStats.map((c) => (
                <div 
                  key={c.id} 
                  className="p-3.5 rounded-lg border space-y-2"
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                        Componente {c.numero}
                      </span>
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white">{c.nombre}</h3>
                    </div>
                    <span className="text-xs font-bold text-sky-600 dark:text-sky-400 font-mono">
                      {Number(c.porcentajeCumplimiento)}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min(100, Math.max(0, Number(c.porcentajeCumplimiento) || 0))}%`,
                        backgroundColor: '#009fe3'
                      }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-400 pt-0.5">
                    <span>Total: {c.totalCapitulos} capítulos</span>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{c.aprobados} aprobados</span>
                      {c.observados > 0 && (
                        <span className="text-rose-600 dark:text-rose-400 font-semibold">{c.observados} observados</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Productividad del Equipo / Delegados */}
        <div 
          className="p-5 rounded-xl border shadow-xs space-y-4"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Productividad de Docentes y Delegados
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Aportes y Subsanaciones</span>
          </div>

          <div className="overflow-x-auto pt-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b font-bold text-slate-500 dark:text-slate-400" style={{ borderColor: 'var(--border-color)' }}>
                  <th className="py-2.5 px-3">Docente / Delegado</th>
                  <th className="py-2.5 px-2 text-center">Rol</th>
                  <th className="py-2.5 px-2 text-center">Caps.</th>
                  <th className="py-2.5 px-2 text-center">Obs.</th>
                  <th className="py-2.5 px-2 text-center">Subsanadas</th>
                </tr>
              </thead>
              <tbody className="divide-y text-[11px]" style={{ borderColor: 'var(--border-color)' }}>
                {productividad.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No hay registros de productividad disponibles.
                    </td>
                  </tr>
                ) : (
                  productividad.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{p.nombre}</div>
                        <div className="text-[10px] text-slate-400 font-mono">@{p.username}</div>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                          {p.rol}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-slate-700 dark:text-slate-300">
                        {p.capitulosAsignados}
                      </td>
                      <td className="py-2.5 px-2 text-center text-amber-600 dark:text-amber-400 font-semibold font-mono">
                        {p.observacionesEmitidas}
                      </td>
                      <td className="py-2.5 px-2 text-center text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                        {p.observacionesSubsanadas}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
