import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import type { PlanEstudio, ReporteFinalPayload } from '../types';
import { 
  Printer, Layers, Calendar, FileText, 
  CheckCircle2, RefreshCw, Download, ShieldCheck
} from 'lucide-react';

export const FinalReportCompiler: React.FC = () => {
  const [planes, setPlanes] = useState<PlanEstudio[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number>(1);
  const [reporte, setReporte] = useState<ReporteFinalPayload | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar lista de planes disponibles
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
    <div className="space-y-6">
      {/* Barra de Controles Superiores (Oculta en Impresión) */}
      <div className="print:hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 rounded-2xl border"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div>
          <div className="flex items-center gap-2">
            <Printer className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Compilador del Reporte Curricular Oficial</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg border text-xs font-semibold focus:outline-none"
            style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
          >
            {planes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo} - {p.carrera}
              </option>
            ))}
          </select>

          <button
            onClick={compilarReporte}
            className="p-1.5 rounded-lg border hover:opacity-80"
            style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
            title="Recompilar documento"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleImprimir}
            className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:opacity-90 shadow-sm"
          >
            <Download className="w-4 h-4" />
            Imprimir / Exportar PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs opacity-60">Compilando datos curriculares oficiales...</div>
      ) : !reporte ? (
        <div className="p-16 text-center text-xs opacity-60">No se pudo cargar la compilación del reporte.</div>
      ) : (
        /* Documento Oficial Formateado para Pantalla e Impresión */
        <div className="final-report-document max-w-4xl mx-auto rounded-2xl border p-8 md:p-12 shadow-sm space-y-10 print:p-0 print:border-none print:shadow-none print:max-w-none print:bg-white print:text-black"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          
          {/* Encabezado Institucional de la UAGRM */}
          <div className="text-center border-b pb-8 space-y-2" style={{ borderColor: 'var(--border-color)' }}>
            <div className="text-xs uppercase font-extrabold tracking-widest text-primary print:text-blue-900">
              Universidad Autónoma Gabriel René Moreno
            </div>
            <div className="text-xs uppercase tracking-wider font-semibold opacity-70 print:text-slate-700">
              Facultad de Ciencias de la Computación y Telecomunicaciones
            </div>
            <div className="text-xs uppercase tracking-wider font-semibold opacity-70 print:text-slate-700">
              Carrera de Ingeniería en Sistemas
            </div>

            <div className="pt-4 pb-2">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase">
                DOCUMENTO DE REDISEÑO CURRICULAR
              </h1>
              <div className="text-base font-bold text-primary mt-1 print:text-blue-900">
                PLAN DE ESTUDIOS {reporte.plan.codigo} ({reporte.plan.anio_vigencia})
              </div>
            </div>

            <div className="flex justify-center items-center gap-4 text-[11px] opacity-60 pt-2 print:text-slate-600">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Fecha de Emisión: {new Date(reporte.fechaCompilacion).toLocaleDateString('es-BO', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Estado del Plan: {reporte.plan.estado}
              </span>
            </div>
          </div>

          {/* Sección 1: Datos Generales y Objetivos del Plan */}
          <section className="report-section space-y-4 break-inside-avoid">
            <h2 className="text-base font-bold uppercase tracking-wider border-b pb-2 text-primary print:text-blue-900"
              style={{ borderColor: 'var(--border-color)' }}>
              1. Marco Institucional y Perfil de Formación
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border text-xs"
              style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}>
              <div>
                <span className="opacity-60 block text-[10px] uppercase font-bold">Carrera</span>
                <span className="font-bold">{reporte.plan.carrera}</span>
              </div>
              <div>
                <span className="opacity-60 block text-[10px] uppercase font-bold">Código Oficial</span>
                <span className="font-bold font-mono">{reporte.plan.codigo}</span>
              </div>
              <div>
                <span className="opacity-60 block text-[10px] uppercase font-bold">Total Asignaturas</span>
                <span className="font-bold">{reporte.totalAsignaturas} materias</span>
              </div>
              <div>
                <span className="opacity-60 block text-[10px] uppercase font-bold">Carga Crediticia</span>
                <span className="font-bold">{reporte.totalCreditos} créditos</span>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div>
                <h3 className="font-bold text-xs uppercase opacity-80 mb-1">Descripción del Plan</h3>
                <p className="opacity-80 text-justify">
                  {reporte.plan.descripcion || 'Plan de formación profesional para responder a los estándares actuales de la industria del software y sistemas de información.'}
                </p>
              </div>

              <div>
                <h3 className="font-bold text-xs uppercase opacity-80 mb-1">Objetivos de la Carrera</h3>
                <p className="opacity-80 text-justify whitespace-pre-line">
                  {reporte.plan.objetivos}
                </p>
              </div>

              <div>
                <h3 className="font-bold text-xs uppercase opacity-80 mb-1">Perfil de Egreso</h3>
                <p className="opacity-80 text-justify whitespace-pre-line">
                  {reporte.plan.perfil_egreso}
                </p>
              </div>
            </div>
          </section>

          {/* Sección 2: Malla Curricular Consolidada */}
          <section className="report-section space-y-4 break-inside-avoid">
            <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-base font-bold uppercase tracking-wider text-primary print:text-blue-900">
                2. Estructura de la Malla Curricular
              </h2>
              <span className="text-xs opacity-60">
                {reporte.totalAsignaturas} asignaturas registradas
              </span>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="report-table w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b font-bold opacity-80" style={{ borderColor: 'var(--border-color)' }}>
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
                    <tr key={asig.id} className="hover:bg-black/5 dark:hover:bg-white/5">
                      <td className="py-2 px-2 text-center font-bold">{asig.semestre}°</td>
                      <td className="py-2 px-2 font-mono font-bold text-primary print:text-blue-900">{asig.sigla}</td>
                      <td className="py-2 px-3 font-semibold">{asig.nombre}</td>
                      <td className="py-2 px-2 text-center opacity-70">{asig.horas_teoricas}</td>
                      <td className="py-2 px-2 text-center opacity-70">{asig.horas_practicas}</td>
                      <td className="py-2 px-2 text-center font-bold">{asig.creditos}</td>
                      <td className="py-2 px-3">
                        {asig.prerrequisitos && asig.prerrequisitos.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {asig.prerrequisitos.map((pr) => (
                              <span key={pr.id} className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 font-mono text-[10px]">
                                {pr.sigla}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="opacity-40 italic text-[10px]">Sin prerrequisito</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Sección 3: Capítulos Aprobados por Componente */}
          <section className="report-section space-y-6">
            <div className="border-b pb-2" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-base font-bold uppercase tracking-wider text-primary print:text-blue-900">
                3. Capítulos Validados y Aprobados por el Comité
              </h2>
              <p className="text-xs opacity-60 mt-0.5">
                Solo se compilan los capítulos que completaron el ciclo de revisión técnica y obtuvieron aprobación oficial.
              </p>
            </div>

            <div className="space-y-8">
              {reporte.plan.componentes.map((comp) => {
                const capsAprobados = comp.capitulos || [];
                return (
                  <div key={comp.id} className="report-component space-y-4 break-inside-avoid">
                    <div className="flex items-center gap-2 border-b pb-1 font-bold text-xs" style={{ borderColor: 'var(--border-color)' }}>
                      <Layers className="w-4 h-4 text-primary" />
                      <span className="uppercase">COMPONENTE {comp.numero}: {comp.nombre}</span>
                    </div>

                    {capsAprobados.length === 0 ? (
                      <div className="p-3 text-xs italic opacity-50 border rounded-lg"
                        style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}>
                        No hay capítulos aprobados formalmente en este componente aún.
                      </div>
                    ) : (
                      capsAprobados.map((cap) => (
                        <div key={cap.id} className="report-chapter p-5 rounded-xl border space-y-3"
                          style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}>
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                                Capítulo {cap.numero}
                              </span>
                              <h3 className="font-bold text-sm">{cap.titulo}</h3>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Estado: Aprobado
                            </span>
                          </div>

                          {/* Contenido Completo del Capítulo */}
                          <div className="text-xs leading-relaxed opacity-90 whitespace-pre-line text-justify pt-1 border-t border-dashed"
                            style={{ borderColor: 'var(--border-color)' }}>
                            {cap.contenido || 'Contenido pendiente de redacción.'}
                          </div>

                          {/* Redactores y Evidencias Vinculadas */}
                          <div className="pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[11px] opacity-70">
                            <div>
                              <span className="font-semibold">Redactor(es): </span>
                              {cap.redactores && cap.redactores.length > 0 ? (
                                cap.redactores.map((r) => r.nombre_completo || r.nombreCompleto).join(', ')
                              ) : (
                                <span className="italic">Sin redactor registrado</span>
                              )}
                            </div>

                            {cap.evidencias && cap.evidencias.length > 0 && (
                              <div className="flex items-center gap-1.5">
                                <FileText className="w-3 h-3 text-primary" />
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
          <section className="report-section space-y-4 break-inside-avoid">
            <div className="border-b pb-2" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-base font-bold uppercase tracking-wider text-primary print:text-blue-900">
                4. Anexo de Resoluciones y Evidencias Normativas
              </h2>
              <p className="text-xs opacity-60 mt-0.5">
                Documentación legal y resoluciones del Ilustre Consejo Universitario que respaldan el rediseño.
              </p>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="report-table w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b font-bold opacity-80" style={{ borderColor: 'var(--border-color)' }}>
                    <th className="py-2 px-3">Código de Norma</th>
                    <th className="py-2 px-3">Título del Documento</th>
                    <th className="py-2 px-3">Órgano Emisor</th>
                    <th className="py-2 px-3">Fecha de Emisión</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[11px]" style={{ borderColor: 'var(--border-color)' }}>
                  {reporte.evidenciasVigentes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center opacity-50">
                        No hay documentos de evidencia registrados como vigentes.
                      </td>
                    </tr>
                  ) : (
                    reporte.evidenciasVigentes.map((doc) => (
                      <tr key={doc.id}>
                        <td className="py-2 px-3 font-mono font-bold text-primary print:text-blue-900">{doc.codigo_norma}</td>
                        <td className="py-2 px-3 font-semibold">{doc.titulo}</td>
                        <td className="py-2 px-3 opacity-80">{doc.organo_emisor}</td>
                        <td className="py-2 px-3 opacity-80">
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
          <div className="pt-12 text-center border-t text-xs opacity-60 space-y-1 print:pt-16 print:text-black"
            style={{ borderColor: 'var(--border-color)' }}>
            <div className="grid grid-cols-2 gap-8 max-w-md mx-auto pt-6">
              <div className="border-t pt-2 text-[11px]" style={{ borderColor: 'var(--border-color)' }}>
                <div className="font-bold">Comité Curricular</div>
                <div className="text-[10px] opacity-70">Ingeniería en Sistemas</div>
              </div>
              <div className="border-t pt-2 text-[11px]" style={{ borderColor: 'var(--border-color)' }}>
                <div className="font-bold">Dirección de Carrera</div>
                <div className="text-[10px] opacity-70">UAGRM - FICCT</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
