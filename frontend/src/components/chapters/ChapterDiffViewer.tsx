import React, { useState, useMemo } from 'react';
import type { VersionCapitulo } from '../../types';
import { computeLineDiff } from '../../utils/diffUtils';
import { 
  GitCompare, Maximize2, Minimize2, Download, Clock, 
  User, CheckCircle2, FileText, ArrowRight, Layers 
} from 'lucide-react';

interface ChapterDiffViewerProps {
  versiones: VersionCapitulo[];
}

export const ChapterDiffViewer: React.FC<ChapterDiffViewerProps> = ({ versiones }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Ordenar de más antigua a más reciente para el orden lógico de comparación
  const sortedAsc = useMemo(() => {
    return [...versiones].sort((a, b) => a.numero_version - b.numero_version);
  }, [versiones]);

  // Selección por defecto: comparar la penúltima con la última
  const [baseVersionId, setBaseVersionId] = useState<number>(() => {
    if (sortedAsc.length >= 2) {
      return sortedAsc[sortedAsc.length - 2].id;
    }
    return sortedAsc[0]?.id || 0;
  });

  const [targetVersionId, setTargetVersionId] = useState<number>(() => {
    if (sortedAsc.length >= 1) {
      return sortedAsc[sortedAsc.length - 1].id;
    }
    return 0;
  });

  const baseVersion = useMemo(() => {
    return sortedAsc.find((v) => v.id === baseVersionId);
  }, [sortedAsc, baseVersionId]);

  const targetVersion = useMemo(() => {
    return sortedAsc.find((v) => v.id === targetVersionId);
  }, [sortedAsc, targetVersionId]);

  // Calcular Diff en tiempo real
  const diffResult = useMemo(() => {
    if (!baseVersion && !targetVersion) return null;
    if (baseVersion && !targetVersion) {
      return computeLineDiff('', baseVersion.contenido_texto);
    }
    if (!baseVersion && targetVersion) {
      return computeLineDiff('', targetVersion.contenido_texto);
    }
    return computeLineDiff(baseVersion!.contenido_texto, targetVersion!.contenido_texto);
  }, [baseVersion, targetVersion]);

  if (sortedAsc.length === 0) {
    return (
      <div 
        className="p-12 text-center rounded-2xl border border-dashed space-y-3"
        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}
      >
        <div className="inline-flex p-3 rounded-2xl bg-black/5 dark:bg-white/5 opacity-60">
          <Layers className="w-8 h-8" />
        </div>
        <h3 className="text-sm font-bold">Sin Versiones Registradas</h3>
        <p className="text-xs opacity-60 max-w-md mx-auto">
          Aún no se ha cargado ningún documento para este capítulo. Suba el primer archivo PDF o borrador para iniciar el historial de versiones.
        </p>
      </div>
    );
  }

  const containerClasses = isFullScreen
    ? 'fixed inset-0 z-[150] p-6 overflow-y-auto backdrop-blur-md flex flex-col'
    : 'rounded-2xl border shadow-sm space-y-4 p-5';

  return (
    <div
      className={containerClasses}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-color)',
        color: 'var(--text-main)',
      }}
    >
      {/* Barra de Controles y Selección de Versiones */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm flex items-center gap-2">
              <span>Comparador de Versiones de Documento</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-primary/10 text-primary">
                Modo Git Unificado
              </span>
            </h3>
            <p className="text-[11px] opacity-60">
              Contraste visual de cambios redactados entre entregas de subsanación.
            </p>
          </div>
        </div>

        {/* Selectores de Comparación y Botón Pantalla Completa */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {sortedAsc.length > 1 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="opacity-60 text-[11px]">Comparar:</span>
              <select
                value={baseVersionId}
                onChange={(e) => setBaseVersionId(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-lg border font-semibold text-xs focus:outline-none"
                style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
              >
                {sortedAsc.map((v) => (
                  <option key={`base-${v.id}`} value={v.id}>
                    v{v.numero_version} - {v.nombre_archivo}
                  </option>
                ))}
              </select>

              <ArrowRight className="w-3.5 h-3.5 opacity-40 shrink-0" />

              <select
                value={targetVersionId}
                onChange={(e) => setTargetVersionId(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-lg border font-semibold text-xs focus:outline-none"
                style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
              >
                {sortedAsc.map((v) => (
                  <option key={`target-${v.id}`} value={v.id}>
                    v{v.numero_version} - {v.nombre_archivo}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Botón de Pantalla Completa */}
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2 rounded-lg border hover:opacity-80 transition ml-auto"
            style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
            title={isFullScreen ? 'Salir de pantalla completa' : 'Ver a pantalla completa'}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Resumen de Métricas de Cambio (Badges estilo GitHub) */}
      {diffResult && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-black/5 dark:bg-white/5 border text-xs" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2 font-mono">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              +{diffResult.stats.additions} adiciones
            </span>
            <span className="font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
              -{diffResult.stats.deletions} eliminaciones
            </span>
            <span className="opacity-60 text-[11px]">
              {diffResult.stats.totalLines} líneas analizadas
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] opacity-75">
            {targetVersion?.archivo_ruta && (
              <a
                href={`/storage/${targetVersion.archivo_ruta}`}
                target="_blank"
                rel="noreferrer"
                download
                className="flex items-center gap-1.5 text-primary hover:underline font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar {targetVersion.nombre_archivo}</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Metadatos de la Versión Evaluada */}
      {targetVersion && (
        <div className="p-3 rounded-xl border bg-black/5 dark:bg-white/5 space-y-1 text-xs" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-primary" />
              Versión #{targetVersion.numero_version}: {targetVersion.resumen_cambio || 'Entrega de documento'}
            </span>
            <span className="opacity-60 text-[11px] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {new Date(targetVersion.created_at).toLocaleString('es-BO')}
            </span>
          </div>
          <div className="opacity-70 text-[11px] flex items-center gap-1">
            <User className="w-3.5 h-3.5 opacity-60" />
            <span>Publicado por: {targetVersion.usuario?.nombre_completo || 'Redactor'} (@{targetVersion.usuario?.username})</span>
          </div>
        </div>
      )}

      {/* Si solo hay 1 versión: aviso informativo */}
      {sortedAsc.length === 1 && (
        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-500" />
          <span>
            Se encuentra registrada únicamente la <strong>Versión 1 (Documento Inicial)</strong>. Cuando el equipo evaluador formule observaciones técnicas y se entregue la Versión 2 de subsanación, los cambios se remarcarán automáticamente en verde y rojo en este visualizador.
          </span>
        </div>
      )}

      {/* Visor Diff Unificado (Línea por Línea estilo GitHub) */}
      <div 
        className="rounded-xl border overflow-x-auto font-mono text-xs flex-1 max-h-[60vh] overflow-y-auto"
        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
      >
        {diffResult && diffResult.lines.length > 0 ? (
          <table className="w-full border-collapse">
            <tbody>
              {diffResult.lines.map((line, idx) => {
                const isAdded = line.type === 'added';
                const isRemoved = line.type === 'removed';

                const rowBg = isAdded
                  ? 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-200'
                  : isRemoved
                  ? 'bg-rose-500/15 text-rose-900 dark:text-rose-200'
                  : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-90';

                const linePrefix = isAdded ? '+' : isRemoved ? '-' : ' ';
                const prefixColor = isAdded ? 'text-emerald-600 font-bold' : isRemoved ? 'text-rose-600 font-bold' : 'opacity-30';

                return (
                  <tr key={`diff-line-${idx}`} className={`${rowBg} transition-colors border-b border-black/5 dark:border-white/5`}>
                    {/* Número de línea anterior */}
                    <td className="w-12 px-2 py-0.5 text-right select-none opacity-40 text-[10px] border-r border-black/5 dark:border-white/5">
                      {line.oldLineNumber || ''}
                    </td>

                    {/* Número de línea nueva */}
                    <td className="w-12 px-2 py-0.5 text-right select-none opacity-40 text-[10px] border-r border-black/5 dark:border-white/5">
                      {line.newLineNumber || ''}
                    </td>

                    {/* Símbolo + / - */}
                    <td className={`w-6 px-1.5 py-0.5 text-center select-none ${prefixColor} text-xs`}>
                      {linePrefix}
                    </td>

                    {/* Contenido textual */}
                    <td className={`px-2 py-0.5 whitespace-pre-wrap break-words text-[11px] leading-relaxed ${isRemoved ? 'line-through decoration-rose-500/60' : ''}`}>
                      {line.content || ' '}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-xs opacity-50">
            No se detectaron diferencias entre las versiones seleccionadas.
          </div>
        )}
      </div>
    </div>
  );
};
