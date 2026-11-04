import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import type { PlanEstudio, ComponenteStat, ProductividadUsuario } from '../types';
import { 
  BarChart3, Layers, CheckCircle2, 
  MessageSquare, RefreshCw, UserCheck, 
  Award
} from 'lucide-react';

export const BusinessStats: React.FC = () => {
  const [planes, setPlanes] = useState<PlanEstudio[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number>(1);
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
          setSelectedPlanId(res.data.planes[0].id);
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
  const porcentajeGlobal = totalCapitulos > 0 ? Math.round((totalAprobados / totalCapitulos) * 100) : 0;

  const totalObsEmitidas = productividad.reduce((acc, p) => acc + p.observacionesEmitidas, 0);
  const totalObsSubsanadas = productividad.reduce((acc, p) => acc + p.observacionesSubsanadas, 0);

  return (
    <div className="space-y-6">
      {/* Encabezado y Filtro de Plan */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary" />
            <h1 className="text-2xl font-bold">Estadísticas del Negocio Curricular</h1>
          </div>
          <p className="text-xs opacity-60 mt-1">
            Caso de Uso 8 (CU8) y Requisito 8: Cumplimiento por componentes temáticos y productividad del comité de rediseño.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Selector de Plan */}
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-60 font-semibold">Plan:</span>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg border text-xs font-semibold focus:outline-none"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
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
            className="p-2 rounded-lg border hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            title="Recargar estadísticas"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tarjetas Resumen Global (CU8, RF-09) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs opacity-60">Avance Curricular Oficial</span>
            <span className="text-xs font-bold text-primary">{porcentajeGlobal}%</span>
          </div>
          <div className="text-2xl font-black mt-1">
            {totalAprobados} / {totalCapitulos}
          </div>
          <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-2 overflow-hidden mt-3">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${porcentajeGlobal}%` }}
            />
          </div>
          <div className="text-[10px] opacity-50 mt-2">Capítulos aprobados formalmente</div>
        </div>

        <div className="p-4 rounded-xl border flex items-center justify-between"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div>
            <div className="text-xs opacity-60">Capítulos con Observaciones</div>
            <div className="text-2xl font-black text-rose-500 mt-1">{totalObservados}</div>
            <div className="text-[11px] opacity-50 mt-0.5">Requieren subsanación técnica</div>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-rose-500/10 text-rose-500">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border flex items-center justify-between"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div>
            <div className="text-xs opacity-60">Observaciones Técnicas</div>
            <div className="text-2xl font-black text-amber-500 mt-1">{totalObsEmitidas}</div>
            <div className="text-[11px] opacity-50 mt-0.5">
              {totalObsSubsanadas} subsanadas ({totalObsEmitidas > 0 ? Math.round((totalObsSubsanadas / totalObsEmitidas) * 100) : 0}%)
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-500/10 text-amber-500">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border flex items-center justify-between"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div>
            <div className="text-xs opacity-60">Comité de Rediseño</div>
            <div className="text-2xl font-black text-indigo-500 mt-1">{productividad.length}</div>
            <div className="text-[11px] opacity-50 mt-0.5">Docentes y delegados activos</div>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-500/10 text-indigo-500">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Grid: Cumplimiento por Componente Temático & Productividad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cumplimiento por Componente Curricular */}
        <div className="p-5 rounded-2xl border space-y-4"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-bold">Avance por Componente Curricular</h2>
          </div>
          <p className="text-[11px] opacity-60">
            Desglose de estados y cumplimiento porcentual por bloque estructural del plan.
          </p>

          <div className="space-y-4 pt-2">
            {componentesStats.length === 0 ? (
              <div className="text-xs opacity-50 text-center py-6">No hay componentes registrados para este plan.</div>
            ) : (
              componentesStats.map((c) => (
                <div key={c.id} className="p-4 rounded-xl border space-y-2"
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        Componente {c.numero}
                      </span>
                      <h3 className="font-bold text-xs">{c.nombre}</h3>
                    </div>
                    <span className="text-xs font-bold text-primary">
                      {c.porcentajeCumplimiento}%
                    </span>
                  </div>

                  <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${c.porcentajeCumplimiento}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] opacity-70 pt-1">
                    <span>Total: {c.totalCapitulos} capítulos</span>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-500 font-semibold">{c.aprobados} aprobados</span>
                      {c.observados > 0 && (
                        <span className="text-rose-500 font-semibold">{c.observados} observados</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Productividad del Equipo / Delegados */}
        <div className="p-5 rounded-2xl border space-y-4"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-bold">Productividad de Docentes y Delegados</h2>
          </div>
          <p className="text-[11px] opacity-60">
            Registro de capítulos asumidos y aportes en señalamientos técnicos y subsanaciones.
          </p>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b opacity-60" style={{ borderColor: 'var(--border-color)' }}>
                  <th className="py-2.5 px-3">Docente / Delegado</th>
                  <th className="py-2.5 px-2 text-center">Rol</th>
                  <th className="py-2.5 px-2 text-center">Capítulos</th>
                  <th className="py-2.5 px-2 text-center">Obs. Emitidas</th>
                  <th className="py-2.5 px-2 text-center">Subsanadas</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {productividad.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center opacity-50">
                      No hay registros de productividad disponibles.
                    </td>
                  </tr>
                ) : (
                  productividad.map((p) => (
                    <tr key={p.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold">{p.nombre}</div>
                        <div className="text-[10px] opacity-50 font-mono">@{p.username}</div>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/5 dark:bg-white/5">
                          {p.rol}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold">
                        {p.capitulosAsignados}
                      </td>
                      <td className="py-2.5 px-2 text-center text-amber-600 font-semibold">
                        {p.observacionesEmitidas}
                      </td>
                      <td className="py-2.5 px-2 text-center text-emerald-600 font-semibold">
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
