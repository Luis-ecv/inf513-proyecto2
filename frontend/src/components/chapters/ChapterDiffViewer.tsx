import React, { useState, useMemo } from 'react';
import type { VersionCapitulo } from '../../types';
import { computeLineDiff } from '../../utils/diffUtils';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { 
  GitCompare, Maximize2, Minimize2, Download, Clock, 
  User, CheckCircle2, FileText, ArrowRight, Layers 
} from 'lucide-react';

interface ChapterDiffViewerProps {
  versiones: VersionCapitulo[];
}

export const ChapterDiffViewer: React.FC<ChapterDiffViewerProps> = ({ versiones }) => {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDescargar = async () => {
    if (!targetVersion) return;
    setDownloading(true);
    try {
      const res = await api.get(`/capitulos/versiones/${targetVersion.id}/descargar`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = targetVersion.nombre_archivo;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al descargar versión de capítulo:', err);
      window.alert('No se pudo descargar el documento digital.');
    } finally {
      setDownloading(false);
    }
  };

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
        className="p-10 text-center rounded-xl border border-dashed space-y-2.5"
        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}
      >
        <div className="inline-flex p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">Sin Versiones Registradas</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Aún no se ha cargado ningún documento digital para este capítulo. Sube un archivo PDF o Markdown para inicializar el historial de versiones.
        </p>
      </div>
    );
  }

  const containerClasses = isFullScreen
    ? 'fixed inset-0 z-150 p-6 overflow-y-auto backdrop-blur-md flex flex-col'
    : 'rounded-xl border shadow-xs space-y-3.5 p-4';

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
      <div 
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 pb-3 border-b" 
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sistemas-cyan">
            <GitCompare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <span>Comparador Diferencial de Versiones</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-sky-500/10 text-sistemas-cyan border border-sky-500/20">
                LCS Git-Style
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Contraste de líneas redactadas entre entregas técnicas de subsanación.
            </p>
          </div>
        </div>

        {/* Selectores de Comparación y Botón Pantalla Completa */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full lg:w-auto min-w-0">
          {sortedAsc.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 text-xs min-w-0 max-w-full">
              <span className="text-slate-400 text-[11px] font-medium shrink-0">Comparar:</span>
              <select
                value={baseVersionId}
                onChange={(e) => setBaseVersionId(Number(e.target.value))}
                className="px-2.5 py-1 rounded-lg border font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 max-w-[140px] sm:max-w-[200px] md:max-w-[260px] truncate cursor-pointer"
                style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                title={sortedAsc.find(v => v.id === baseVersionId)?.nombre_archivo}
              >
                {sortedAsc.map((v) => (
                  <option key={`base-${v.id}`} value={v.id}>
                    v{v.numero_version} - {v.nombre_archivo}
                  </option>
                ))}
              </select>

              <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

              <select
                value={targetVersionId}
                onChange={(e) => setTargetVersionId(Number(e.target.value))}
                className="px-2.5 py-1 rounded-lg border font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 max-w-[140px] sm:max-w-[200px] md:max-w-[260px] truncate cursor-pointer"
                style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                title={sortedAsc.find(v => v.id === targetVersionId)?.nombre_archivo}
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
            className="p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition ml-auto text-slate-600 dark:text-slate-300 cursor-pointer"
            style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
            title={isFullScreen ? 'Salir de pantalla completa' : 'Ver a pantalla completa'}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Resumen de Métricas de Cambio */}
      {diffResult && (
        <div 
          className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-lg border text-xs" 
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
        >
          <div className="flex items-center gap-2 font-mono">
            <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[11px]">
              +{diffResult.stats.additions} adiciones
            </span>
            <span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 text-[11px]">
              -{diffResult.stats.deletions} eliminaciones
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-sans font-medium">
              {diffResult.stats.totalLines} líneas analizadas
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            {targetVersion?.archivo_ruta && (
              <button
                type="button"
                onClick={handleDescargar}
                disabled={downloading}
                className="flex items-center gap-1.5 text-sistemas-cyan hover:underline font-bold disabled:opacity-50 cursor-pointer max-w-full"
                title={`Descargar ${targetVersion.nombre_archivo}`}
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                  {downloading ? 'Descargando...' : `Descargar ${targetVersion.nombre_archivo}`}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Metadatos de la Versión Evaluada */}
      {targetVersion && (
        <div 
          className="p-2.5 rounded-lg border space-y-1 text-xs" 
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
              <FileText className="w-3.5 h-3.5 text-sistemas-cyan" />
              Versión #{targetVersion.numero_version}: {targetVersion.resumen_cambio || 'Entrega de documento'}
            </span>
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {new Date(targetVersion.created_at).toLocaleString('es-BO')}
            </span>
          </div>
          <div className="text-slate-500 text-[11px] flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>Publicado por: <strong className="text-slate-700 dark:text-slate-300">{targetVersion.usuario?.nombre_completo || 'Redactor'}</strong> (@{targetVersion.usuario?.username})</span>
          </div>
        </div>
      )}

      {/* Si solo hay 1 versión: aviso informativo */}
      {sortedAsc.length === 1 && (
        <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-500" />
          <span>
            Registrada únicamente la <strong>Versión 1 (Documento Inicial)</strong>. Al registrar la versión 2 de subsanación, los cambios se remarcarán en verde y rojo automáticamente.
          </span>
        </div>
      )}

      {/* Visor Diff Unificado (Línea por Línea estilo GitHub) */}
      <div 
        className="rounded-lg border overflow-x-auto font-mono text-xs flex-1 max-h-[60vh] overflow-y-auto"
        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
      >
        {diffResult && diffResult.lines.length > 0 ? (
          <table className="w-full border-collapse">
            <tbody>
              {diffResult.lines.map((line, idx) => {
                const isAdded = line.type === 'added';
                const isRemoved = line.type === 'removed';

                const rowBg = isAdded
                  ? (isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-500/10 text-emerald-800')
                  : isRemoved
                  ? (isDark ? 'bg-rose-500/15 text-rose-300' : 'bg-rose-500/10 text-rose-800')
                  : (isDark ? 'hover:bg-slate-800/40 text-slate-200' : 'hover:bg-slate-100/50 text-slate-700');

                const linePrefix = isAdded ? '+' : isRemoved ? '-' : ' ';
                const prefixColor = isAdded 
                  ? (isDark ? 'text-emerald-400 font-bold' : 'text-emerald-600 font-bold') 
                  : isRemoved 
                  ? (isDark ? 'text-rose-400 font-bold' : 'text-rose-600 font-bold') 
                  : (isDark ? 'text-slate-500' : 'text-slate-400');

                return (
                  <tr key={`diff-line-${idx}`} className={`${rowBg} transition-colors border-b ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                    {/* Número de línea anterior */}
                    <td className={`w-10 px-2 py-0.5 text-right select-none ${isDark ? 'text-slate-500 border-white/5' : 'text-slate-400 border-black/5'} text-[10px] border-r`}>
                      {line.oldLineNumber || ''}
                    </td>

                    {/* Número de línea nueva */}
                    <td className={`w-10 px-2 py-0.5 text-right select-none ${isDark ? 'text-slate-500 border-white/5' : 'text-slate-400 border-black/5'} text-[10px] border-r`}>
                      {line.newLineNumber || ''}
                    </td>

                    {/* Símbolo + / - */}
                    <td className={`w-5 px-1 py-0.5 text-center select-none ${prefixColor} text-xs font-mono`}>
                      {linePrefix}
                    </td>

                    {/* Contenido textual */}
                    <td className={`px-2 py-0.5 whitespace-pre-wrap break-words text-[11px] leading-relaxed font-mono ${isRemoved ? (isDark ? 'line-through decoration-rose-400/70' : 'line-through decoration-rose-600/70') : ''}`}>
                      {line.content || ' '}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            No se detectaron diferencias textuales entre las versiones seleccionadas.
          </div>
        )}
      </div>
    </div>
  );
};
