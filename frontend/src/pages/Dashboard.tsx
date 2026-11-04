import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle2, AlertTriangle, Clock, FileEdit, 
  GitFork, Archive, ArrowUpRight, BarChart3 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetricas = async () => {
      try {
        const res = await api.get('/dashboard/metricas');
        if (res.data.success) {
          setData(res.data.metricas);
        }
      } catch (err) {
        console.error('Error al cargar métricas del tablero:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetricas();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-sm opacity-60">Cargando métricas del sistema...</div>
      </div>
    );
  }

  const plan = data?.plan;
  const porEstado = data?.porEstado || {};
  const porcentaje = data?.porcentajeAvance || 0;
  const alertas = data?.alertasObservados || [];
  const resumenMalla = data?.resumenMalla || { totalAsignaturas: 0, totalCreditos: 0 };

  return (
    <div className="space-y-6">
      {/* Bienvenida y Plan Activo */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl border shadow-sm"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Hola, {user?.nombreCompleto} 👋
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Supervisión del Rediseño Curricular • <span className="font-semibold">{plan?.carrera} ({plan?.codigo})</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg border text-xs" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}>
            <span className="opacity-60">Estado del Plan:</span> <span className="font-bold text-amber-500">{plan?.estado}</span>
          </div>
          <Link
            to="/malla"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
            style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-text)' }}
          >
            Ver Malla Curricular <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Tarjetas Principales de Métricas (RF-09) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Avance Global */}
        <div className="p-5 rounded-2xl border shadow-sm flex flex-col justify-between"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold opacity-70">Avance del Rediseño</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold">{porcentaje}%</div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${porcentaje}%` }} 
              />
            </div>
            <span className="text-[11px] opacity-60 mt-1 block">Capítulos aprobados con evidencias</span>
          </div>
        </div>

        {/* Capítulos en Borrador */}
        <div className="p-5 rounded-2xl border shadow-sm flex flex-col justify-between"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold opacity-70">En Redacción (Borrador)</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <FileEdit className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold">{porEstado['Borrador'] || 0}</div>
            <span className="text-[11px] opacity-60 mt-1 block">Secciones en redacción inicial</span>
          </div>
        </div>

        {/* Capítulos en Revisión */}
        <div className="p-5 rounded-2xl border shadow-sm flex flex-col justify-between"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold opacity-70">En Revisión</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold">{porEstado['En Revisión'] || 0}</div>
            <span className="text-[11px] opacity-60 mt-1 block">Sometidos a evaluación formal</span>
          </div>
        </div>

        {/* Capítulos Observados (Alerta) */}
        <div className="p-5 rounded-2xl border shadow-sm flex flex-col justify-between"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold opacity-70">Observados (Atención)</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-amber-500">{porEstado['Observado'] || 0}</div>
            <span className="text-[11px] opacity-60 mt-1 block">Requieren subsanación técnica</span>
          </div>
        </div>
      </div>

      {/* Alertas de Secciones Observadas y Accesos Rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alertas de Observados (RF-09) */}
        <div className="lg:col-span-2 p-5 rounded-2xl border shadow-sm"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Alertas de Secciones Observadas
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: 'var(--border-color)' }}>
              {alertas.length} pendiente(s)
            </span>
          </div>

          {alertas.length === 0 ? (
            <div className="text-center py-8 text-xs opacity-60 border border-dashed rounded-xl" style={{ borderColor: 'var(--border-color)' }}>
              No existen capítulos con observaciones técnicas pendientes de subsanación.
            </div>
          ) : (
            <div className="space-y-3">
              {alertas.map((cap: any) => (
                <div 
                  key={cap.id} 
                  className="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition"
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                >
                  <div>
                    <div className="text-xs font-bold">
                      Capítulo {cap.numero}: {cap.titulo}
                    </div>
                    <div className="text-[11px] opacity-70 mt-0.5">
                      Componente: {cap.componente?.nombre} • {cap.observaciones?.length || 0} observación(es) técnica(s)
                    </div>
                  </div>

                  <Link
                    to={`/capitulos/${cap.id}`}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border hover:opacity-80 transition self-start sm:self-auto shrink-0"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}
                  >
                    Subsanar Observación →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumen Malla y Accesos Directos */}
        <div className="p-5 rounded-2xl border shadow-sm space-y-4"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
          <h2 className="text-sm font-bold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" /> Resumen de la Malla
          </h2>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}>
              <div className="text-2xl font-bold">{resumenMalla.totalAsignaturas}</div>
              <div className="text-[11px] opacity-60">Asignaturas</div>
            </div>
            <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}>
              <div className="text-2xl font-bold text-blue-500">{resumenMalla.totalCreditos}</div>
              <div className="text-[11px] opacity-60">Créditos Totales</div>
            </div>
          </div>

          <div className="pt-2 border-t space-y-2 text-xs" style={{ borderColor: 'var(--border-color)' }}>
            <Link
              to="/grafo"
              className="flex items-center justify-between p-2.5 rounded-lg border hover:opacity-80 transition"
              style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
            >
              <span className="flex items-center gap-2 font-medium">
                <GitFork className="w-4 h-4 text-purple-500" /> Grafo de Prerrequisitos
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-50" />
            </Link>

            <Link
              to="/evidencias"
              className="flex items-center justify-between p-2.5 rounded-lg border hover:opacity-80 transition"
              style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
            >
              <span className="flex items-center gap-2 font-medium">
                <Archive className="w-4 h-4 text-emerald-500" /> Repositorio de Evidencias
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-50" />
            </Link>

            {user?.rol === 'Director' && (
              <Link
                to="/bitacora"
                className="flex items-center justify-between p-2.5 rounded-lg border hover:opacity-80 transition"
                style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
              >
                <span className="flex items-center gap-2 font-medium">
                  <BarChart3 className="w-4 h-4 text-amber-500" /> Bitácora de Accesos
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-50" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
