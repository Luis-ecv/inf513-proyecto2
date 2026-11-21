import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  ReactFlow, Background, Controls, MiniMap, 
  useNodesState, useEdgesState, 
  type Node, type Edge, type Connection
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import api from '../services/api';
import { CustomSubjectNode } from '../components/graph/CustomSubjectNode';
import { 
  GitFork, Plus, AlertCircle, CheckCircle2, RotateCcw, 
  ArrowLeft, X, Info, Unlink, Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getActivePlanId } from '../services/activePlan';
import { useAuth } from '../context/AuthContext';

export const PrerequisiteGraph: React.FC = () => {
  const { user } = useAuth();
  const esInvitado = user?.rol?.toLowerCase() === 'invitado';
  const nodeTypes = useMemo(() => ({ customSubjectNode: CustomSubjectNode }), []);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [rawNodes, setRawNodes] = useState<Node[]>([]);
  const [rawEdges, setRawEdges] = useState<Edge[]>([]);

  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal para vincular nuevo prerrequisito (RF-03)
  const [showModal, setShowModal] = useState(false);
  const [showDesvincularModal, setShowDesvincularModal] = useState(false);
  const [asignaturasList, setAsignaturasList] = useState<any[]>([]);
  const [targetAsigId, setTargetAsigId] = useState<number | ''>('');
  const [reqAsigId, setReqAsigId] = useState<number | ''>('');
  const [vincularError, setVincularError] = useState('');
  const [vincularSuccess, setVincularSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [unlinkingEdgeId, setUnlinkingEdgeId] = useState<string | null>(null);

  // Cargar Grafo desde API
  const fetchGrafo = async () => {
    try {
      const res = await api.get(`/planes/${getActivePlanId()}/grafo`);
      if (res.data.success) {
        const grafoNodes: Node[] = res.data.grafo.nodes.map((n: any) => ({
          ...n,
          data: { ...n.data, highlightState: 'normal' },
        }));
        const grafoEdges: Edge[] = res.data.grafo.edges;

        setNodes(grafoNodes);
        setEdges(grafoEdges);
        setRawNodes(grafoNodes);
        setRawEdges(grafoEdges);
      }
    } catch (err) {
      console.error('Error al cargar grafo de prerrequisitos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar catálogo de asignaturas para el modal
  const fetchAsignaturasList = async () => {
    try {
      const res = await api.get(`/planes/${getActivePlanId()}/asignaturas`);
      if (res.data.success) {
        setAsignaturasList(res.data.asignaturas);
      }
    } catch (err) {
      console.error('Error al cargar lista de materias:', err);
    }
  };

  useEffect(() => {
    fetchGrafo();
    fetchAsignaturasList();
  }, []);

  // Interacción al hacer clic en un nodo: Resaltar cadena hacia atrás y adelante (CU3, RF-04)
  const onNodeClick = useCallback(async (_: React.MouseEvent, node: Node) => {
    const asigId = Number(node.id);
    setSelectedSubject(node.data);

    try {
      const res = await api.get(`/asignaturas/${asigId}/dependencias`);
      if (res.data.success) {
        const { prerrequisitosIds, dependientesIds } = res.data.cadena;

        const preSet = new Set<number>(prerrequisitosIds);
        const depSet = new Set<number>(dependientesIds);

        // Actualizar estados visuales de los nodos
        setNodes((prevNodes) =>
          prevNodes.map((n) => {
            const currentId = Number(n.id);
            let highlightState: 'selected' | 'backward' | 'forward' | 'dimmed' | 'normal' = 'dimmed';

            if (currentId === asigId) {
              highlightState = 'selected';
            } else if (preSet.has(currentId)) {
              highlightState = 'backward';
            } else if (depSet.has(currentId)) {
              highlightState = 'forward';
            }

            return {
              ...n,
              data: {
                ...n.data,
                highlightState,
              },
            };
          })
        );

        // Actualizar aristas con colores oficiales
        setEdges((prevEdges) =>
          prevEdges.map((e) => {
            const isBackward = e.target === node.id && preSet.has(Number(e.source));
            const isForward = e.source === node.id && depSet.has(Number(e.target));
            const isRelevant = isBackward || isForward;

            return {
              ...e,
              animated: isRelevant,
              style: {
                ...e.style,
                stroke: isBackward ? '#f59e0b' : isForward ? '#8dc63f' : 'rgba(150, 150, 150, 0.2)',
                strokeWidth: isRelevant ? 3 : 1,
              },
            };
          })
        );
      }
    } catch (err) {
      console.error('Error al obtener dependencias:', err);
    }
  }, [setNodes, setEdges]);

  // Restaurar vista sin selección
  const resetHighlight = () => {
    setSelectedSubject(null);
    setNodes(rawNodes);
    setEdges(rawEdges);
  };

  // Vincular nuevo prerrequisito con validación de ciclo (RF-03)
  const handleVincular = async (e: React.FormEvent) => {
    e.preventDefault();
    setVincularError('');
    setVincularSuccess('');

    if (!targetAsigId || !reqAsigId) {
      setVincularError('Debe seleccionar ambas asignaturas.');
      return;
    }

    if (targetAsigId === reqAsigId) {
      setVincularError('Una asignatura no puede ser prerrequisito de sí misma.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/prerrequisitos', {
        id_asignatura: targetAsigId,
        id_asignatura_requisito: reqAsigId,
      });

      if (res.data.success) {
        setVincularSuccess(res.data.message);
        setTimeout(() => {
          setShowModal(false);
          setVincularSuccess('');
          setTargetAsigId('');
          setReqAsigId('');
        }, 1200);
        await fetchGrafo();
      }
    } catch (err: any) {
      setVincularError(err.response?.data?.message || 'Error al vincular el prerrequisito.');
    } finally {
      setSaving(false);
    }
  };

  // Conexión interactiva arrastrando aristas entre handles
  const onConnect = useCallback(
    async (params: Connection) => {
      if (esInvitado) return;
      if (!params.source || !params.target) return;
      const sourceId = Number(params.source);
      const targetId = Number(params.target);

      try {
        const res = await api.post('/prerrequisitos', {
          id_asignatura: targetId,
          id_asignatura_requisito: sourceId,
        });

        if (res.data.success) {
          await fetchGrafo();
        }
      } catch (err: any) {
        alert(err.response?.data?.message || 'Validación de Grafo: No se puede conectar (genera ciclo o es inválido).');
      }
    },
    [esInvitado]
  );

  const handleDesvincular = async (edge: Edge) => {
    if (esInvitado) return;
    setUnlinkingEdgeId(edge.id);
    try {
      const res = await api.delete('/prerrequisitos', {
        data: {
          id_asignatura: Number(edge.target),
          id_asignatura_requisito: Number(edge.source),
        },
      });

      if (res.data.success) {
        await fetchGrafo();
        setShowDesvincularModal(false);
      }
    } catch (err: any) {
      window.alert(err.response?.data?.message || 'No se pudo desvincular la prelación.');
    } finally {
      setUnlinkingEdgeId(null);
    }
  };

  const nombreMateria = (id: string) => {
    const node = rawNodes.find((item) => item.id === id);
    return node ? `${node.data.sigla} - ${node.data.nombre}` : `Asignatura #${id}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-xs font-semibold text-slate-400 animate-pulse flex items-center gap-2">
          <GitFork className="w-4 h-4 animate-spin text-sistemas-cyan" />
          Cargando grafo interactivo de prelaciones pedagógicas...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Barra Superior de Control y Leyenda */}
      <div 
        className="p-4 rounded-xl border shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-3">
          <Link
            to="/malla"
            className="p-2 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
            title="Volver a la Malla Curricular"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <GitFork className="w-4 h-4 text-sistemas-cyan" />
              Grafo Acíclico Dirigido (DAG) de Prerrequisitos
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Haz clic sobre cualquier asignatura para inspeccionar su cadena de prelaciones.
            </p>
          </div>
        </div>

        {/* Leyenda y Acciones */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Leyenda de colores */}
          <div 
            className="flex items-center gap-3 text-[11px] font-medium px-3 py-1.5 border rounded-lg" 
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
          >
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Previo (atrás)
            </span>
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-sistemas-green" /> Dependiente (adelante)
            </span>
          </div>

          {selectedSubject && (
            <button
              onClick={resetHighlight}
              className="flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Limpiar Selección
            </button>
          )}

          {!esInvitado && (
            <>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition bg-sky-500 hover:bg-sky-600 text-white"
              >
                <Plus className="w-3.5 h-3.5" /> Vincular Materia
              </button>
              <button
                onClick={() => setShowDesvincularModal(true)}
                disabled={rawEdges.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold hover:bg-rose-500/10 transition disabled:opacity-40 text-rose-500"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
              >
                <Unlink className="w-3.5 h-3.5" /> Desvincular
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Contenedor del Grafo Interactivo */}
      <div 
        className="h-[640px] rounded-xl border shadow-inner relative overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onConnect={onConnect}
          nodesDraggable={!esInvitado}
          nodesConnectable={!esInvitado}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          maxZoom={1.8}
        >
          <Background color="var(--border-color)" gap={20} size={1} />
          <Controls />
          <MiniMap 
            nodeStrokeColor="#009fe3"
            nodeColor="var(--bg-card)"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
          />
        </ReactFlow>

        {/* Panel lateral flotante con detalle de la materia seleccionada */}
        {selectedSubject && (
          <div 
            className="absolute top-4 right-4 w-76 p-4 rounded-xl border shadow-xl text-xs z-10 backdrop-blur-md space-y-2.5 animate-in fade-in slide-in-from-right-2 duration-150"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <span className="font-mono font-bold text-sm text-sistemas-cyan">{selectedSubject.sigla}</span>
                <span className="text-[10px] ml-2 font-medium text-slate-500">Semestre {selectedSubject.semestre}</span>
              </div>
              <button onClick={resetHighlight} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="font-bold text-xs leading-snug text-slate-800 dark:text-slate-100">
              {selectedSubject.nombre}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] py-1 border-y" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <span className="text-slate-400 block font-medium">Créditos:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{selectedSubject.creditos} cr</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Área Formativa:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200 truncate block">{selectedSubject.areaFormativa}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300">
              <span className="font-bold block">⬅ Trazabilidad hacia atrás:</span>
              Materias en tono ámbar que deben aprobarse previamente.
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-300">
              <span className="font-bold block">➡ Trazabilidad hacia adelante:</span>
              Materias en tono verde que se habilitan al aprobar esta asignatura.
            </div>
          </div>
        )}

        {/* Modal de Desvinculación */}
        {showDesvincularModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div
              className="w-full max-w-lg p-6 rounded-xl border shadow-2xl relative"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
            >
              <button
                onClick={() => setShowDesvincularModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <X className="w-4 h-4" />
              </button>
              <h2 className="text-sm font-bold flex items-center gap-2 mb-1 text-slate-900 dark:text-white">
                <Unlink className="w-4 h-4 text-rose-500" /> Desvincular Prelación Académica
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Selecciona la arista de prerrequisito que deseas eliminar del grafo curricular.
              </p>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {rawEdges.map((edge) => (
                  <div
                    key={edge.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border text-xs"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
                  >
                    <span className="min-w-0 truncate font-medium text-slate-700 dark:text-slate-200">
                      {nombreMateria(edge.source)} <span className="text-slate-400">→</span> {nombreMateria(edge.target)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDesvincular(edge)}
                      disabled={unlinkingEdgeId === edge.id}
                      className="shrink-0 p-1.5 rounded-md border text-rose-500 hover:bg-rose-500/10 disabled:opacity-40 transition"
                      style={{ borderColor: 'var(--border-color)' }}
                      title="Eliminar esta prelación"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Modal para Vincular Prerrequisito con Validación de Grafo (RF-03) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            className="w-full max-w-md p-6 rounded-xl border shadow-2xl relative"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
          >
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-sm font-bold flex items-center gap-2 mb-1 text-slate-900 dark:text-white">
              <GitFork className="w-4 h-4 text-sistemas-cyan" /> Vincular Materia Prerrequisito
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              El motor en el backend validará que la nueva arista no genere ciclos directos ni indirectos.
            </p>

            {vincularError && (
              <div className="mb-4 p-3 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{vincularError}</span>
              </div>
            )}

            {vincularSuccess && (
              <div className="mb-4 p-3 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{vincularSuccess}</span>
              </div>
            )}

            <form onSubmit={handleVincular} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Materia Destino (La que exige el requisito):
                </label>
                <select
                  value={targetAsigId}
                  onChange={(e) => setTargetAsigId(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                  required
                >
                  <option value="">Seleccione una materia...</option>
                  {asignaturasList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.sigla} - {a.nombre} (Semestre {a.semestre})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Materia Prerrequisito (La que se debe aprobar antes):
                </label>
                <select
                  value={reqAsigId}
                  onChange={(e) => setReqAsigId(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                  required
                >
                  <option value="">Seleccione el prerrequisito...</option>
                  {asignaturasList.map((a) => (
                    <option key={a.id} value={a.id} disabled={a.id === targetAsigId}>
                      {a.sigla} - {a.nombre} (Semestre {a.semestre})
                    </option>
                  ))}
                </select>
              </div>

              <div 
                className="p-3 rounded-lg border flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300" 
                style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
              >
                <Info className="w-4 h-4 shrink-0 text-sky-500 mt-0.5" />
                <span>
                  <strong>Control de Grafo:</strong> Si intentas conectar dependencias cíclicas, el algoritmo BFS del backend rechazará la operación protegiendo la consistencia de la carrera.
                </span>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                  {saving ? 'Validando Grafo...' : 'Vincular Prerrequisito'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
