import React, { useEffect, useState } from 'react';
import api from '../services/api';
import type { PlanEstudio, Asignatura } from '../types';
import { 
  BookOpen, Plus, GitFork, AlertCircle, 
  X, Search, Pencil, Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getActivePlanId, setActivePlanId } from '../services/activePlan';
import { useAuth } from '../context/AuthContext';

const getAreaBorderClass = (area: string): string => {
  const a = area.toLowerCase();
  if (a.includes('prog') || a.includes('software')) return 'border-l-4 border-l-sky-500';
  if (a.includes('base') || a.includes('datos') || a.includes('sist')) return 'border-l-4 border-l-emerald-500';
  if (a.includes('mat') || a.includes('básic')) return 'border-l-4 border-l-blue-600';
  if (a.includes('hard') || a.includes('red') || a.includes('telem')) return 'border-l-4 border-l-purple-500';
  if (a.includes('gest') || a.includes('hum') || a.includes('proy')) return 'border-l-4 border-l-amber-500';
  return 'border-l-4 border-l-slate-400';
};

export const CurriculumGrid: React.FC = () => {
  const { user } = useAuth();
  const esInvitado = user?.rol?.toLowerCase() === 'invitado';
  const [planes, setPlanes] = useState<PlanEstudio[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number>(getActivePlanId);
  const [plan, setPlan] = useState<PlanEstudio | null>(null);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [totalCreditos, setTotalCreditos] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Estado del modal de nueva materia (RF-02)
  const [showModal, setShowModal] = useState(false);
  const [editingAsignaturaId, setEditingAsignaturaId] = useState<number | null>(null);
  const [formSigla, setFormSigla] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formSemestre, setFormSemestre] = useState(1);
  const [formHT, setFormHT] = useState(4);
  const [formHP, setFormHP] = useState(2);
  const [formCreditos, setFormCreditos] = useState(5);
  const [formArea, setFormArea] = useState('Programación');
  const [formAreaPersonalizada, setFormAreaPersonalizada] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Estado del modal de plan de estudio
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planError, setPlanError] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [planCodigo, setPlanCodigo] = useState('');
  const [planCarrera, setPlanCarrera] = useState('');
  const [planAnio, setPlanAnio] = useState(new Date().getFullYear());
  const [planDescripcion, setPlanDescripcion] = useState('');
  const [planObjetivos, setPlanObjetivos] = useState('');
  const [planPerfil, setPlanPerfil] = useState('');
  const [planCreditosMin, setPlanCreditosMin] = useState(200);
  const [planCreditosMax, setPlanCreditosMax] = useState(280);

  const fetchPlanes = async () => {
    const res = await api.get('/planes');
    if (res.data.success) {
      const planesDisponibles: PlanEstudio[] = res.data.planes;
      setPlanes(planesDisponibles);
      if (planesDisponibles.length > 0 && !planesDisponibles.some((item) => item.id === selectedPlanId)) {
        setSelectedPlanId(planesDisponibles[0].id);
        setActivePlanId(planesDisponibles[0].id);
      }
    }
  };

  const fetchAsignaturas = async (idPlan = selectedPlanId) => {
    try {
      const res = await api.get(`/planes/${idPlan}/asignaturas`);
      if (res.data.success) {
        setPlan(res.data.plan);
        setAsignaturas(res.data.asignaturas);
        setTotalCreditos(res.data.totalCreditos);
      }
    } catch (err) {
      console.error('Error al cargar malla curricular:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanes().catch((err) => console.error('Error al cargar planes de estudio:', err));
  }, []);

  useEffect(() => {
    if (selectedPlanId) {
      setLoading(true);
      fetchAsignaturas(selectedPlanId);
    }
  }, [selectedPlanId]);

  const handleGuardarPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlanError('');

    if (!planCodigo.trim() || !planCarrera.trim() || !planObjetivos.trim() || !planPerfil.trim()) {
      setPlanError('Código, carrera, objetivos y perfil de egreso son obligatorios.');
      return;
    }

    setSavingPlan(true);
    try {
      const datosPlan = {
        codigo: planCodigo.trim().toUpperCase(),
        carrera: planCarrera.trim(),
        anio_vigencia: planAnio,
        descripcion: planDescripcion.trim(),
        objetivos: planObjetivos.trim(),
        perfil_egreso: planPerfil.trim(),
        limite_creditos_min: planCreditosMin,
        limite_creditos_max: planCreditosMax,
      };
      const res = editingPlanId
        ? await api.put(`/planes/${editingPlanId}`, datosPlan)
        : await api.post('/planes', datosPlan);

      if (res.data.success) {
        const nuevoPlan: PlanEstudio = res.data.plan;
        setShowPlanModal(false);
        setEditingPlanId(null);
        setSelectedPlanId(nuevoPlan.id);
        setActivePlanId(nuevoPlan.id);
        setPlanCodigo('');
        setPlanCarrera('');
        setPlanDescripcion('');
        setPlanObjetivos('');
        setPlanPerfil('');
        await fetchPlanes();
      }
    } catch (err: any) {
      setPlanError(err.response?.data?.message || 'Error al registrar el plan de estudio.');
    } finally {
      setSavingPlan(false);
    }
  };

  const abrirEdicionPlan = () => {
    if (!plan) return;
    setEditingPlanId(plan.id);
    setPlanCodigo(plan.codigo);
    setPlanCarrera(plan.carrera);
    setPlanAnio(plan.anio_vigencia);
    setPlanDescripcion(plan.descripcion || '');
    setPlanObjetivos(plan.objetivos);
    setPlanPerfil(plan.perfil_egreso);
    setPlanCreditosMin(plan.limite_creditos_min);
    setPlanCreditosMax(plan.limite_creditos_max);
    setPlanError('');
    setShowPlanModal(true);
  };

  const handleCrearAsignatura = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const areaFormativa = formArea === '__nueva__' ? formAreaPersonalizada.trim() : formArea;

    if (!formSigla.trim() || !formNombre.trim() || !areaFormativa) {
      setFormError('La sigla, el nombre y el área formativa son obligatorios.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        sigla: formSigla.trim().toUpperCase(),
        nombre: formNombre.trim(),
        semestre: formSemestre,
        horas_teoricas: formHT,
        horas_practicas: formHP,
        creditos: formCreditos,
        area_formativa: areaFormativa,
        id_plan_estudio: plan?.id || 1,
      };
      const res = editingAsignaturaId
        ? await api.put(`/asignaturas/${editingAsignaturaId}`, payload)
        : await api.post('/asignaturas', payload);

      if (res.data.success) {
        setShowModal(false);
        setEditingAsignaturaId(null);
        setFormSigla('');
        setFormNombre('');
        setFormArea('Programación');
        setFormAreaPersonalizada('');
        await fetchAsignaturas();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Error al registrar la materia.');
    } finally {
      setSaving(false);
    }
  };

  const abrirEdicionAsignatura = (asignatura: Asignatura) => {
    const areasPredefinidas = ['Programación', 'Bases de Datos', 'Matemáticas', 'Hardware', 'Humanidades', 'Gestión'];
    setEditingAsignaturaId(asignatura.id);
    setFormSigla(asignatura.sigla);
    setFormNombre(asignatura.nombre);
    setFormSemestre(asignatura.semestre);
    setFormHT(asignatura.horas_teoricas);
    setFormHP(asignatura.horas_practicas);
    setFormCreditos(asignatura.creditos);
    if (areasPredefinidas.includes(asignatura.area_formativa)) {
      setFormArea(asignatura.area_formativa);
      setFormAreaPersonalizada('');
    } else {
      setFormArea('__nueva__');
      setFormAreaPersonalizada(asignatura.area_formativa);
    }
    setFormError('');
    setShowModal(true);
  };

  const eliminarAsignatura = async (asignatura: Asignatura) => {
    if (!window.confirm(`¿Deseas eliminar la asignatura ${asignatura.sigla} - ${asignatura.nombre}?`)) {
      return;
    }

    try {
      await api.delete(`/asignaturas/${asignatura.id}`);
      await fetchAsignaturas();
    } catch (err: any) {
      window.alert(err.response?.data?.message || 'No se pudo eliminar la asignatura.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-xs font-semibold text-slate-400 animate-pulse flex items-center gap-2">
          <BookOpen className="w-4 h-4 animate-spin text-sistemas-cyan" />
          Cargando estructura de la malla curricular...
        </div>
      </div>
    );
  }

  // Agrupar materias por semestres (1 al 10)
  const materiasFiltradas = asignaturas.filter(a => 
    a.sigla.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.area_formativa.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const semestres = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="space-y-4">
      {/* 1. Cabecera Institucional del Plan de Estudios */}
      <div 
        className="p-5 rounded-xl border shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              {plan?.codigo || 'PLAN-2026'} • Vigencia {plan?.anio_vigencia || '2026'}
            </span>
            <span className="text-xs text-slate-400 font-medium">Malla Curricular Oficial</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            {plan?.carrera || 'Ingeniería en Sistemas'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {plan?.objetivos || 'Formación de profesionales de excelencia con competencias tecnológicas y científicas.'}
          </p>
        </div>

        {/* Toolbar de Plan y Acciones */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de Plan */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Plan:</span>
            <select
              value={selectedPlanId}
              onChange={(e) => {
                const idPlan = Number(e.target.value);
                setSelectedPlanId(idPlan);
                setActivePlanId(idPlan);
              }}
              className="max-w-[200px] px-2.5 py-2 rounded-lg border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
              {planes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.codigo} - {item.carrera}
                </option>
              ))}
            </select>
          </div>

          {!esInvitado && (
            <>
              <button
                onClick={() => {
                  setEditingPlanId(null);
                  setPlanCodigo('');
                  setPlanCarrera('');
                  setPlanAnio(new Date().getFullYear());
                  setPlanDescripcion('');
                  setPlanObjetivos('');
                  setPlanPerfil('');
                  setPlanCreditosMin(200);
                  setPlanCreditosMax(280);
                  setPlanError('');
                  setShowPlanModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
              >
                <Plus className="w-3.5 h-3.5 text-emerald-500" />
                <span>Nuevo Plan</span>
              </button>

              {plan && (
                <button
                  type="button"
                  onClick={abrirEdicionPlan}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                >
                  <Pencil className="w-3.5 h-3.5 text-sky-500" />
                  <span>Editar Plan</span>
                </button>
              )}
            </>
          )}

          {/* Contador de Créditos */}
          <div 
            className="px-3 py-1.5 rounded-lg border text-center" 
            style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
          >
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Créditos</div>
            <div className="text-sm font-bold text-sistemas-cyan leading-tight">
              {totalCreditos} <span className="text-[11px] text-slate-400 font-normal">/ {plan?.limite_creditos_max}</span>
            </div>
          </div>

          <Link
            to="/grafo"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <GitFork className="w-3.5 h-3.5 text-sistemas-cyan" />
            <span>Ver Grafo</span>
          </Link>

          {!esInvitado && (
            <button
              onClick={() => {
                setEditingAsignaturaId(null);
                setFormSigla('');
                setFormNombre('');
                setFormSemestre(1);
                setFormHT(4);
                setFormHP(2);
                setFormCreditos(5);
                setFormArea('Programación');
                setFormAreaPersonalizada('');
                setFormError('');
                setShowModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold shadow-xs transition bg-sky-500 hover:bg-sky-600 text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Asignatura</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Filtro y Contador en Línea */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por sigla, nombre o área..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
          />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Mostrando <span className="font-bold text-slate-800 dark:text-slate-200">{materiasFiltradas.length}</span> de {asignaturas.length} asignaturas
        </div>
      </div>

      {/* 3. Cuadrícula Visual por Semestres (1 al 10) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {semestres.map((sem) => {
          const materiasSemestre = materiasFiltradas.filter(a => a.semestre === sem);
          const creditosSemestre = materiasSemestre.reduce((acc, curr) => acc + curr.creditos, 0);

          return (
            <div
              key={sem}
              className="p-3 rounded-xl border flex flex-col space-y-2.5 min-h-[300px]"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
            >
              <div 
                className="flex items-center justify-between pb-2 border-b" 
                style={{ borderColor: 'var(--border-color)' }}
              >
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  Semestre {sem}
                </span>
                <span 
                  className="text-xs px-2 py-0.5 rounded font-mono font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80"
                >
                  {creditosSemestre} cr
                </span>
              </div>

              <div className="space-y-2 flex-1">
                {materiasSemestre.length === 0 ? (
                  <div 
                    className="text-center py-6 text-xs text-slate-400 border border-dashed rounded-lg"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    Sin materias
                  </div>
                ) : (
                  materiasSemestre.map((asig) => (
                    <div
                      key={asig.id}
                      className={`p-2.5 rounded-lg border shadow-2xs transition hover:border-sky-400 ${getAreaBorderClass(asig.area_formativa)}`}
                      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono font-bold text-xs text-sistemas-cyan">
                          {asig.sigla}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span 
                            className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80"
                          >
                            {asig.creditos} cr
                          </span>
                          {!esInvitado && (
                            <>
                              <button
                                type="button"
                                onClick={() => abrirEdicionAsignatura(asig)}
                                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-sky-500 transition cursor-pointer"
                                title="Editar asignatura"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => eliminarAsignatura(asig)}
                                className="p-1 rounded hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                                title="Eliminar asignatura"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="font-semibold text-xs leading-snug line-clamp-2 text-slate-800 dark:text-slate-100" title={asig.nombre}>
                        {asig.nombre}
                      </div>

                      <div 
                        className="flex items-center justify-between mt-2 pt-1.5 border-t text-[11px] text-slate-500 dark:text-slate-400 font-medium" 
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        <span>HT: {asig.horas_teoricas}h | HP: {asig.horas_practicas}h</span>
                        <span className="truncate max-w-[95px] text-right font-medium" title={asig.area_formativa}>
                          {asig.area_formativa}
                        </span>
                      </div>

                      {/* Prerrequisitos de la materia */}
                      {asig.prerrequisitos && asig.prerrequisitos.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {asig.prerrequisitos.map((pre) => (
                            <span 
                              key={pre.id}
                              className="text-[11px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono font-medium"
                            >
                              Req: {pre.sigla}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Modal de Plan de Estudio */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-xl border shadow-2xl relative"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
          >
            <button 
              onClick={() => setShowPlanModal(false)} 
              className="absolute top-4 right-4 p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition" 
              style={{ borderColor: 'var(--border-color)' }}
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-sm font-bold flex items-center gap-2 mb-1 text-slate-900 dark:text-white">
              <BookOpen className="w-4 h-4 text-emerald-500" /> {editingPlanId ? 'Editar Plan de Estudio' : 'Registrar Nuevo Plan de Estudio'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {editingPlanId ? 'Actualiza los parámetros del plan curricular.' : 'El plan se registrará en estado "En Elaboración" para vincularle materias.'}
            </p>

            {planError && (
              <div className="mb-4 p-3 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{planError}</span>
              </div>
            )}

            <form onSubmit={handleGuardarPlan} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Código Oficial:</label>
                  <input 
                    value={planCodigo} 
                    onChange={(e) => setPlanCodigo(e.target.value)} 
                    placeholder="ej: PLAN-2027" 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 uppercase font-mono" 
                    style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }} 
                    required 
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Año de Vigencia:</label>
                  <input 
                    type="number" 
                    min="1990" 
                    value={planAnio} 
                    onChange={(e) => setPlanAnio(Number(e.target.value))} 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium" 
                    style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }} 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Carrera Universitaria:</label>
                <input 
                  value={planCarrera} 
                  onChange={(e) => setPlanCarrera(e.target.value)} 
                  placeholder="ej: Ingeniería en Sistemas" 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium" 
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }} 
                  required 
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Descripción General:</label>
                <textarea 
                  value={planDescripcion} 
                  onChange={(e) => setPlanDescripcion(e.target.value)} 
                  rows={2} 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none font-medium" 
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }} 
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Objetivos Formativos:</label>
                <textarea 
                  value={planObjetivos} 
                  onChange={(e) => setPlanObjetivos(e.target.value)} 
                  rows={3} 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none font-medium" 
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }} 
                  required 
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Perfil de Egreso:</label>
                <textarea 
                  value={planPerfil} 
                  onChange={(e) => setPlanPerfil(e.target.value)} 
                  rows={3} 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none font-medium" 
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }} 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Créditos Mínimos:</label>
                  <input 
                    type="number" 
                    min="150" 
                    value={planCreditosMin} 
                    onChange={(e) => setPlanCreditosMin(Number(e.target.value))} 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium" 
                    style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }} 
                    required 
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Créditos Máximos:</label>
                  <input 
                    type="number" 
                    min={planCreditosMin} 
                    value={planCreditosMax} 
                    onChange={(e) => setPlanCreditosMax(Number(e.target.value))} 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium" 
                    style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }} 
                    required 
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--border-color)' }}>
                <button 
                  type="button" 
                  onClick={() => setShowPlanModal(false)} 
                  className="px-4 py-2 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition font-semibold text-slate-700 dark:text-slate-300" 
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={savingPlan} 
                  className="px-4 py-2 rounded-lg font-bold shadow-xs transition disabled:opacity-50 bg-sky-500 hover:bg-sky-600 text-white"
                >
                  {savingPlan ? 'Guardando...' : editingPlanId ? 'Actualizar Plan' : 'Guardar Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal de Registro y Edición de Asignaturas */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            className="w-full max-w-lg p-6 rounded-xl border shadow-2xl relative"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
          >
            <button 
              onClick={() => {
                setEditingAsignaturaId(null);
                setShowModal(false);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-sm font-bold flex items-center gap-2 mb-1 text-slate-900 dark:text-white">
              <BookOpen className="w-4 h-4 text-sky-500" /> {editingAsignaturaId ? 'Editar Asignatura' : 'Registrar Nueva Asignatura'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              La materia será integrada al plan curricular con cálculo automático de horas y créditos.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCrearAsignatura} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Sigla Oficial:</label>
                  <input
                    type="text"
                    value={formSigla}
                    onChange={(e) => setFormSigla(e.target.value)}
                    placeholder="ej: INF412"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 uppercase font-mono font-bold"
                    style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Semestre Asignado:</label>
                  <select
                    value={formSemestre}
                    onChange={(e) => setFormSemestre(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                    style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                      <option key={s} value={s}>Semestre {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Nombre de la Materia:</label>
                <input
                  type="text"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="ej: Inteligencia Artificial"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Horas Teóricas:</label>
                  <input
                    type="number"
                    min="0"
                    value={formHT}
                    onChange={(e) => setFormHT(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                    style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Horas Prácticas:</label>
                  <input
                    type="number"
                    min="0"
                    value={formHP}
                    onChange={(e) => setFormHP(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                    style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Créditos:</label>
                  <input
                    type="number"
                    min="1"
                    value={formCreditos}
                    onChange={(e) => setFormCreditos(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                    style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Área Formativa:</label>
                <select
                  value={formArea}
                  onChange={(e) => {
                    setFormArea(e.target.value);
                    if (e.target.value !== '__nueva__') {
                      setFormAreaPersonalizada('');
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                >
                  <option value="Programación">Programación e Ingeniería de Software</option>
                  <option value="Bases de Datos">Bases de Datos y Gestión de Información</option>
                  <option value="Matemáticas">Matemáticas y Ciencias Básicas</option>
                  <option value="Hardware">Hardware, Redes y Telemática</option>
                  <option value="Humanidades">Humanidades y Formación Social</option>
                  <option value="Gestión">Gestión de Proyectos e Innovación</option>
                  <option value="__nueva__">Otra área formativa...</option>
                </select>
                {formArea === '__nueva__' && (
                  <input
                    type="text"
                    value={formAreaPersonalizada}
                    onChange={(e) => setFormAreaPersonalizada(e.target.value)}
                    placeholder="Escribe la nueva área formativa"
                    maxLength={80}
                    className="w-full px-3 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                    style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                  />
                )}
              </div>

              <div className="pt-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => {
                    setEditingAsignaturaId(null);
                    setShowModal(false);
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition font-semibold text-slate-700 dark:text-slate-300"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg font-bold shadow-xs transition disabled:opacity-50 bg-sky-500 hover:bg-sky-600 text-white"
                >
                  {saving ? 'Guardando...' : editingAsignaturaId ? 'Actualizar Asignatura' : 'Guardar Asignatura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
