import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import type { PlanEstudio, ReporteFinalPayload } from '../types';
import { 
  Printer, Layers, Calendar, FileText, 
  CheckCircle2, RefreshCw, Download, ShieldCheck
} from 'lucide-react';
import { getActivePlanId } from '../services/activePlan';
import isotipoSistemas from '../assets/branding/isotipo-sistemas.jpg';

export const FinalReportCompiler: React.FC = () => {
  const [planes, setPlanes] = useState<PlanEstudio[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number>(() => getActivePlanId());
  const [reporte, setReporte] = useState<ReporteFinalPayload | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar lista de planes disponibles
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

  const compilarReporte = useCallback(async () => {
    if (!selectedPlanId) return;
    setLoading(true);
    try {
      const res = await api.get(`/dashboard/planes/${selectedPlanId}/reporte-final`);
      if (res.data.success) {
        setReporte(res.data.reporte);
      }
    } catch (err) {
      console.error('Error al compilar reporte final:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedPlanId]);

  useEffect(() => {
    compilarReporte();
  }, [compilarReporte]);

  useEffect(() => {
    document.body.classList.add('report-print-mode');

    return () => {
      document.body.classList.remove('report-print-mode');
    };
  }, []);

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* 1. Barra de Controles Superiores (Oculta en Impresión) */}
      <div 
        className="print:hidden p-4 rounded-xl border shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              Módulo 4 • Auditoría y Dictamen
            </span>
            <span className="text-xs text-slate-400 font-medium">Exportación Documental A4</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Printer className="w-5 h-5 text-sistemas-cyan" />
            Compilador del Reporte Curricular Oficial
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Generación del expediente curricular consolidado listo para homologación ante el Ilustre Consejo Universitario (ICU).
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
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
            onClick={compilarReporte}
            className="p-2 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-slate-600 dark:text-slate-300"
            style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
            title="Recompilar documento"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sistemas-cyan' : ''}`} />
          </button>

          <button
            onClick={handleImprimir}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Imprimir / Exportar PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400 animate-pulse flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-sistemas-cyan" />
          Compilando datos curriculares oficiales y capítulos validados...
        </div>
      ) : !reporte ? (
        <div className="p-16 text-center text-xs text-slate-400">
          No se pudo cargar la compilación del reporte para el plan seleccionado.
        </div>
      ) : (
        /* Documento Oficial Formateado para Pantalla e Impresión A4 */
        <div 
          className="final-report-document max-w-4xl mx-auto rounded-xl border p-8 md:p-12 shadow-xs space-y-8 print:p-0 print:border-none print:shadow-none print:max-w-none print:bg-white print:text-black"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
        >
          {/* Encabezado Institucional FICCT - UAGRM */}
          <div className="text-center border-b pb-6 space-y-2 relative" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-center gap-4 mb-2">
              <img 
                src={isotipoSistemas} 
                alt="Ingeniería en Sistemas - UAGRM" 
                className="w-14 h-14 object-contain"
              />
            </div>
            <div className="text-[11px] uppercase font-extrabold tracking-widest text-sky-600 dark:text-sky-400 print:text-blue-900">
              Universidad Autónoma Gabriel René Moreno
            </div>
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-300 print:text-slate-700">
              Facultad de Ciencias de la Computación y Telecomunicaciones
            </div>
            <div className="text-xs uppercase tracking-wider font-bold text-slate-800 dark:text-slate-200 print:text-slate-800">
              Carrera de Ingeniería en Sistemas
            </div>

            <div className="pt-3 pb-1">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase text-slate-900 dark:text-white print:text-black">
                DOCUMENTO DE REDISEÑO CURRICULAR
              </h1>
              <div className="text-sm font-bold text-sky-600 dark:text-sky-400 mt-1 print:text-blue-900 font-mono">
                PLAN DE ESTUDIOS {reporte.plan.codigo} ({reporte.plan.anio_vigencia})
              </div>
            </div>

            <div className="flex justify-center items-center gap-4 text-[11px] text-slate-400 pt-1 print:text-slate-600">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Fecha de Emisión: {new Date(reporte.fechaCompilacion).toLocaleDateString('es-BO', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                Estado del Plan: {reporte.plan.estado}
              </span>
            </div>
          </div>

          {/* Sección 1: Datos Generales y Objetivos del Plan */}
          <section className="report-section space-y-4 break-inside-avoid">
            <h2 
              className="text-xs font-bold uppercase tracking-wider border-b pb-2 text-sky-600 dark:text-sky-400 print:text-blue-900"
              style={{ borderColor: 'var(--border-color)' }}
            >
              1. Marco Institucional y Perfil de Formación
            </h2>

            <div 
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg border text-xs"
              style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
            >
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Carrera</span>
                <span className="font-bold text-slate-900 dark:text-white">{reporte.plan.carrera}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Código Oficial</span>
                <span className="font-bold font-mono text-sistemas-cyan">{reporte.plan.codigo}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Asignaturas</span>
                <span className="font-bold text-slate-900 dark:text-white">{reporte.totalAsignaturas} materias</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Carga Crediticia</span>
                <span className="font-bold text-slate-900 dark:text-white">{reporte.totalCreditos} créditos</span>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <div>
                <h3 className="font-bold text-[11px] uppercase text-slate-500 dark:text-slate-400 mb-1">Descripción del Plan</h3>
                <p className="text-justify leading-relaxed">
                  {reporte.plan.descripcion || 'Plan de formación profesional para responder a los estándares actuales de la industria del software, inteligencia computacional y sistemas de información.'}
                </p>
              </div>

              <div>
                <h3 className="font-bold text-[11px] uppercase text-slate-500 dark:text-slate-400 mb-1">Objetivos de la Carrera</h3>
                <p className="text-justify whitespace-pre-line leading-relaxed">
                  {reporte.plan.objetivos}
                </p>
              </div>

              <div>
                <h3 className="font-bold text-[11px] uppercase text-slate-500 dark:text-slate-400 mb-1">Perfil de Egreso</h3>
                <p className="text-justify whitespace-pre-line leading-relaxed">
                  {reporte.plan.perfil_egreso}
                </p>
              </div>
            </div>
          </section>

          {/* Sección 2: Malla Curricular Consolidada */}
          <section className="report-section space-y-3 break-inside-avoid">
            <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 print:text-blue-900">
                2. Estructura de la Malla Curricular
              </h2>
              <span className="text-[11px] text-slate-400 font-medium">
                {reporte.totalAsignaturas} asignaturas registradas
              </span>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="report-table w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b font-bold text-slate-600 dark:text-slate-300" style={{ borderColor: 'var(--border-color)' }}>
                    <th className="py-2 px-2 text-center">Sem.</th>
                    <th className="py-2 px-2">Sigla</th>
                    <th className="py-2 px-3">Nombre de la Asignatura</th>
                    <th className="py-2 px-2 text-center">HT</th>
                    <th className="py-2 px-2 text-center">HP</th>
                    <th className="py-2 px-2 text-center">Créd.</th>
                    <th className="py-2 px-3">Prerrequisitos</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[11px]" style={{ borderColor: 'var(--border-color)' }}>
                  {reporte.plan.asignaturas.map((asig) => (
                    <tr key={asig.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-2 text-center font-bold text-slate-500">{asig.semestre}°</td>
                      <td className="py-2 px-2 font-mono font-bold text-sky-600 dark:text-sky-400 print:text-blue-900">{asig.sigla}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">{asig.nombre}</td>
                      <td className="py-2 px-2 text-center text-slate-500">{asig.horas_teoricas}</td>
                      <td className="py-2 px-2 text-center text-slate-500">{asig.horas_practicas}</td>
                      <td className="py-2 px-2 text-center font-bold text-slate-700 dark:text-slate-300">{asig.creditos}</td>
                      <td className="py-2 px-3">
                        {asig.prerrequisitos && asig.prerrequisitos.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {asig.prerrequisitos.map((pr) => (
                              <span key={pr.id} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-slate-700 dark:text-slate-300">
                                {pr.sigla}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">Sin prerrequisito</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Sección 3: Capítulos Aprobados por Componente */}
          <section className="report-section space-y-4">
            <div className="border-b pb-2" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 print:text-blue-900">
                3. Capítulos Validados y Aprobados por el Comité
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Solo se compilan los capítulos que completaron el ciclo de revisión técnica y obtuvieron aprobación oficial.
              </p>
            </div>

            <div className="space-y-6">
              {reporte.plan.componentes.map((comp) => {
                const capsAprobados = comp.capitulos || [];
                return (
                  <div key={comp.id} className="report-component space-y-3 break-inside-avoid">
                    <div className="flex items-center gap-2 border-b pb-1 font-bold text-xs" style={{ borderColor: 'var(--border-color)' }}>
                      <Layers className="w-4 h-4 text-sistemas-cyan" />
                      <span className="uppercase text-slate-800 dark:text-slate-200">
                        COMPONENTE {comp.numero}: {comp.nombre}
                      </span>
                    </div>

                    {capsAprobados.length === 0 ? (
                      <div 
                        className="p-3 text-xs italic text-slate-400 border rounded-lg"
                        style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                      >
                        No hay capítulos aprobados formalmente en este componente aún.
                      </div>
                    ) : (
                      capsAprobados.map((cap) => (
                        <div 
                          key={cap.id} 
                          className="report-chapter p-4 rounded-lg border space-y-2.5"
                          style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400 tracking-wider">
                                Capítulo {cap.numero}
                              </span>
                              <h3 className="font-bold text-xs text-slate-900 dark:text-white">{cap.titulo}</h3>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Estado: Aprobado
                            </span>
                          </div>

                          {/* Contenido Completo del Capítulo */}
                          <div 
                            className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line text-justify pt-1 border-t border-dashed"
                            style={{ borderColor: 'var(--border-color)' }}
                          >
                            {cap.contenido || 'Contenido pendiente de redacción.'}
                          </div>

                          {/* Redactores y Evidencias Vinculadas */}
                          <div className="pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[11px] text-slate-400">
                            <div>
                              <span className="font-semibold text-slate-600 dark:text-slate-300">Redactor(es): </span>
                              {cap.redactores && cap.redactores.length > 0 ? (
                                cap.redactores.map((r) => r.nombre_completo || r.nombreCompleto).join(', ')
                              ) : (
                                <span className="italic">Sin redactor registrado</span>
                              )}
                            </div>

                            {cap.evidencias && cap.evidencias.length > 0 && (
                              <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-medium">
                                <FileText className="w-3 h-3" />
                                <span>Evidencias vinculadas: {cap.evidencias.length}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Sección 4: Anexo Legal de Normas y Evidencias Vigentes */}
          <section className="report-section space-y-3 break-inside-avoid">
            <div className="border-b pb-2" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 print:text-blue-900">
                4. Anexo de Resoluciones y Evidencias Normativas
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Documentación legal y resoluciones del Ilustre Consejo Universitario que respaldan el rediseño.
              </p>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="report-table w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b font-bold text-slate-600 dark:text-slate-300" style={{ borderColor: 'var(--border-color)' }}>
                    <th className="py-2 px-3">Código de Norma</th>
                    <th className="py-2 px-3">Título del Documento</th>
                    <th className="py-2 px-3">Órgano Emisor</th>
                    <th className="py-2 px-3">Fecha de Emisión</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[11px]" style={{ borderColor: 'var(--border-color)' }}>
                  {reporte.evidenciasVigentes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400">
                        No hay documentos de evidencia registrados como vigentes.
                      </td>
                    </tr>
                  ) : (
                    reporte.evidenciasVigentes.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-mono font-bold text-sky-600 dark:text-sky-400 print:text-blue-900">{doc.codigo_norma}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">{doc.titulo}</td>
                        <td className="py-2 px-3 text-slate-500">{doc.organo_emisor}</td>
                        <td className="py-2 px-3 text-slate-500">
                          {new Date(doc.fecha_emision).toLocaleDateString('es-BO')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Pie del Documento Institucional */}
          <div 
            className="pt-10 text-center border-t text-xs text-slate-400 space-y-1 print:pt-16 print:text-black"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <div className="grid grid-cols-2 gap-8 max-w-md mx-auto pt-4">
              <div className="border-t pt-2 text-[11px]" style={{ borderColor: 'var(--border-color)' }}>
                <div className="font-bold text-slate-800 dark:text-slate-200">Comité Curricular</div>
                <div className="text-[10px] text-slate-400">Ingeniería en Sistemas</div>
              </div>
              <div className="border-t pt-2 text-[11px]" style={{ borderColor: 'var(--border-color)' }}>
                <div className="font-bold text-slate-800 dark:text-slate-200">Dirección de Carrera</div>
                <div className="text-[10px] text-slate-400">UAGRM - FICCT</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
