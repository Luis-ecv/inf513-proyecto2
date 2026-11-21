import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  AlertTriangle, Clock, FileEdit, 
  GitFork, Archive, ArrowUpRight, BarChart3, CalendarCheck,
  ShieldAlert, BookOpen, Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getActivePlanId } from '../services/activePlan';
import { EmptyState } from '../components/common/EmptyState';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetricas = async () => {
      try {
        const res = await api.get('/dashboard/metricas', {
          params: { id_plan: getActivePlanId() },
        });
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
        <div className="text-xs font-semibold text-slate-400 animate-pulse flex items-center gap-2">
          <Clock className="w-4 h-4 animate-spin text-sky-500" />
          Cargando tablero curricular...
        </div>
      </div>
    );
  }

  const plan = data?.plan;
  const porEstado = data?.porEstado || {};
  const porcentaje = data?.porcentajeAvance || 0;
  const alertas = data?.alertasObservados || [];
  const resumenMalla = data?.resumenMalla || { totalAsignaturas: 0, totalCreditos: 0 };

  const totalCapitulos = 
    (porEstado['Borrador'] || 0) + 
    (porEstado['En Revisión'] || 0) + 
    (porEstado['Observado'] || 0) + 
    (porEstado['Aprobado'] || 0);

  const pctAprobado = totalCapitulos > 0 ? ((porEstado['Aprobado'] || 0) / totalCapitulos) * 100 : 0;
  const pctRevision = totalCapitulos > 0 ? ((porEstado['En Revisión'] || 0) / totalCapitulos) * 100 : 0;
  const pctObservado = totalCapitulos > 0 ? ((porEstado['Observado'] || 0) / totalCapitulos) * 100 : 0;
  const pctBorrador = totalCapitulos > 0 ? ((porEstado['Borrador'] || 0) / totalCapitulos) * 100 : 0;

  // Parámetros para el medidor circular SVG
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * Math.min(100, Math.max(0, porcentaje))) / 100;

  return (
    <div className="space-y-5">
      {/* 1. Bienvenida y Estado del Plan Curricular */}
      <div 
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 rounded-xl border shadow-xs"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sistemas-cyan animate-pulse" />
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Tablero de Control • {user?.nombreCompleto}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Supervisión Integral del Rediseño Curricular • <span className="font-semibold text-slate-700 dark:text-slate-200">{plan?.carrera || 'Ingeniería en Sistemas'}</span> ({plan?.codigo || 'Plan 2026'})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div 
            className="px-3 py-1.5 rounded-lg border text-xs font-medium"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
          >
            <span className="text-slate-500 dark:text-slate-400">Estado:</span>{' '}
            <span className="font-bold text-amber-500">{plan?.estado || 'Vigente'}</span>
          </div>

          {user?.rol === 'Director' && (
            <Link
              to="/convocatorias"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border shadow-2xs transition hover:bg-slate-100 dark:hover:bg-slate-800"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}
            >
              <CalendarCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>Convocatorias</span>
            </Link>
          )}

          <Link
            to="/malla"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition bg-sky-500 hover:bg-sky-600 text-white"
          >
            <span>Ver Malla Curricular</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 2. Panel Ejecutivo de Mando y Avance Curricular */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Columna Izquierda: Medidor Circular de Avance Curricular */}
        <div 
          className="lg:col-span-5 p-5 rounded-xl border shadow-xs flex flex-col justify-between"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Comisión de Rediseño
              </span>
              <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                Avance Curricular Global
              </h2>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Certificación FICCT
            </span>
          </div>

          <div className="py-4 flex flex-col sm:flex-row items-center justify-center gap-6">
            {/* Medidor Circular SVG de Precisión Técnica */}
            <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="dialGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#009fe3" />
                    <stop offset="100%" stopColor="#8dc63f" />
                  </linearGradient>
                </defs>
                {/* Círculo base de fondo */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-slate-200 dark:stroke-slate-800"
                  strokeWidth="8"
                  fill="none"
                />
                {/* Arco activo con gradiente oficial */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="url(#dialGradient)"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
                  {porcentaje}%
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5 tracking-wider">
                  Avance
                </span>
              </div>
            </div>

            {/* Métricas Resumidas del Proceso */}
            <div className="space-y-2 text-xs w-full sm:w-auto">
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Capítulos Aprobados:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {porEstado['Aprobado'] || 0} de {totalCapitulos}
                </span>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">En Subsanación:</span>
                <span className="font-bold text-amber-500 font-mono">
                  {porEstado['Observado'] || 0} capítulos
                </span>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">En Revisión Técnica:</span>
                <span className="font-bold text-purple-500 font-mono">
                  {porEstado['En Revisión'] || 0} capítulos
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
            <span>Evidencia documental en regla</span>
            <Link to="/capitulos" className="text-sistemas-cyan font-bold hover:underline">
              Ver Capítulos →
            </Link>
          </div>
        </div>

        {/* Columna Derecha: Barra de Estados Continua y Estructura Curricular */}
        <div 
          className="lg:col-span-7 p-5 rounded-xl border shadow-xs flex flex-col justify-between space-y-4"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div>
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-sistemas-cyan" />
                Distribución de Estados de Capítulos
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">
                {totalCapitulos} capítulos registrados
              </span>
            </div>

            {/* Barra de Progreso Continua Apilada (Progress Stack) */}
            <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 p-0.5 gap-0.5 mt-2 shadow-2xs">
              {pctAprobado > 0 && (
                <div 
                  style={{ width: `${pctAprobado}%` }} 
                  className="h-full bg-emerald-500 rounded-l-full transition-all duration-500" 
                  title={`Aprobado: ${porEstado['Aprobado']} (${Math.round(pctAprobado)}%)`} 
                />
              )}
              {pctRevision > 0 && (
                <div 
                  style={{ width: `${pctRevision}%` }} 
                  className="h-full bg-purple-500 transition-all duration-500" 
                  title={`En Revisión: ${porEstado['En Revisión']} (${Math.round(pctRevision)}%)`} 
                />
              )}
              {pctObservado > 0 && (
                <div 
                  style={{ width: `${pctObservado}%` }} 
                  className="h-full bg-amber-500 transition-all duration-500" 
                  title={`Observado: ${porEstado['Observado']} (${Math.round(pctObservado)}%)`} 
                />
              )}
              {pctBorrador > 0 && (
                <div 
                  style={{ width: `${pctBorrador}%` }} 
                  className="h-full bg-blue-500 rounded-r-full transition-all duration-500" 
                  title={`Borrador: ${porEstado['Borrador']} (${Math.round(pctBorrador)}%)`} 
                />
              )}
            </div>

            {/* Leyenda Horizontal Limpia (Sin Sopa de Bordes) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>Aprobados</span>
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                  {porEstado['Aprobado'] || 0} <span className="text-[11px] font-normal text-slate-400">({Math.round(pctAprobado)}%)</span>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                  <span>En Revisión</span>
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                  {porEstado['En Revisión'] || 0} <span className="text-[11px] font-normal text-slate-400">({Math.round(pctRevision)}%)</span>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span>Observados</span>
                </div>
                <div className="font-bold text-sm text-amber-500 mt-0.5">
                  {porEstado['Observado'] || 0} <span className="text-[11px] font-normal text-slate-400">({Math.round(pctObservado)}%)</span>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <span>Borradores</span>
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                  {porEstado['Borrador'] || 0} <span className="text-[11px] font-normal text-slate-400">({Math.round(pctBorrador)}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dimensionamiento Integrado de la Carrera */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sistemas-cyan flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                  {resumenMalla.totalAsignaturas} Materias
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Malla Plan 2026 oficial
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                  {resumenMalla.totalCreditos} Créditos
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Límite máx: {plan?.limite_creditos_max || 240} cr.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Secciones Observadas y Accesos Rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Lista de Alertas de Observaciones Técnicas (RF-09) */}
        <div 
          className="lg:col-span-2 p-5 rounded-xl border shadow-xs"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Observaciones Pendientes de Subsanación
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-mono">
              {alertas.length} pendiente(s)
            </span>
          </div>

          {alertas.length === 0 ? (
            <EmptyState
              illustration="observations"
              title="Sin observaciones técnicas pendientes"
              description="Todos los capítulos del rediseño curricular han sido subsanados o se encuentran en revisión regular por el comité evaluador."
            />
          ) : (
            <div className="space-y-2">
              {alertas.map((cap: any) => (
                <div 
                  key={cap.id} 
                  className="p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition hover:border-slate-400 dark:hover:border-slate-600"
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      Capítulo {cap.numero}: {cap.titulo}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Componente: {cap.componente?.nombre} • <span className="text-amber-500 font-semibold">{cap.observaciones?.length || 0} observación(es)</span>
                    </div>
                  </div>

                  <Link
                    to={`/capitulos/${cap.id}`}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold border shadow-2xs hover:bg-sky-500 hover:text-white hover:border-sky-500 transition self-start sm:self-auto shrink-0 text-slate-700 dark:text-slate-200 cursor-pointer"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}
                  >
                    Subsanar Observación →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enlaces Rápidos a Módulos Clave */}
        <div 
          className="p-5 rounded-xl border shadow-xs space-y-3.5"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
        >
          <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <BarChart3 className="w-4 h-4 text-sky-500" />
            Accesos Directos del Rediseño
          </h2>

          <div className="space-y-2 text-xs">
            <Link
              to="/grafo"
              className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
            >
              <span className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                <GitFork className="w-4 h-4 text-sistemas-cyan" /> Grafo de Prerrequisitos
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <Link
              to="/evidencias"
              className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
            >
              <span className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                <Archive className="w-4 h-4 text-sistemas-green" /> Repositorio de Evidencias
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <Link
              to="/capitulos"
              className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
            >
              <span className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                <FileEdit className="w-4 h-4 text-blue-500" /> Redacción de Capítulos
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            {user?.rol === 'Director' && (
              <Link
                to="/bitacora"
                className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
              >
                <span className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                  <ShieldAlert className="w-4 h-4 text-amber-500" /> Auditoría y Bitácora
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
