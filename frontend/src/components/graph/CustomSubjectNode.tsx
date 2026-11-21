import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

export interface CustomNodeData {
  id: number;
  sigla: string;
  nombre: string;
  semestre: number;
  creditos: number;
  areaFormativa: string;
  highlightState?: 'selected' | 'backward' | 'forward' | 'dimmed' | 'normal';
  [key: string]: unknown;
}

export const CustomSubjectNode: React.FC<NodeProps> = memo(({ data }) => {
  const nodeData = data as unknown as CustomNodeData;
  const highlight = nodeData.highlightState || 'normal';

  let borderStyle = 'var(--border-color)';
  let bgStyle = 'var(--bg-card)';
  let opacity = 1;
  let shadow = '0 1px 3px rgba(0,0,0,0.06)';
  let badgeText = '';

  if (highlight === 'selected') {
    borderStyle = '#009fe3';
    shadow = '0 0 0 3px rgba(0, 159, 227, 0.35)';
    badgeText = 'Seleccionada';
  } else if (highlight === 'backward') {
    borderStyle = '#f59e0b';
    bgStyle = 'rgba(245, 158, 11, 0.08)';
    badgeText = '⬅ Prerrequisito';
  } else if (highlight === 'forward') {
    borderStyle = '#8dc63f';
    bgStyle = 'rgba(141, 198, 63, 0.1)';
    badgeText = 'Materia Bloqueada ➡';
  } else if (highlight === 'dimmed') {
    opacity = 0.35;
  }

  return (
    <div
      className="p-3 rounded-lg border transition-all text-xs w-56 select-none relative shadow-xs"
      style={{
        backgroundColor: bgStyle,
        borderColor: borderStyle,
        color: 'var(--text-main)',
        opacity,
        boxShadow: shadow,
      }}
    >
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-2.5 h-2.5 !bg-sky-500 !border-2 !border-white dark:!border-slate-900" 
      />

      {badgeText && (
        <span 
          className="absolute -top-2.5 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border shadow-2xs"
          style={{
            backgroundColor: highlight === 'backward' ? '#f59e0b' : highlight === 'forward' ? '#8dc63f' : '#009fe3',
            color: '#ffffff',
            borderColor: 'transparent'
          }}
        >
          {badgeText}
        </span>
      )}

      <div className="flex justify-between items-center mb-1">
        <span className="font-mono font-bold text-sm tracking-wide text-sistemas-cyan">
          {nodeData.sigla}
        </span>
        <span 
          className="text-[10px] px-1.5 py-0.5 rounded border font-semibold text-slate-500 dark:text-slate-400"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
        >
          {nodeData.creditos} cr
        </span>
      </div>

      <div className="font-semibold leading-tight line-clamp-2 h-8 text-slate-800 dark:text-slate-100" title={nodeData.nombre}>
        {nodeData.nombre}
      </div>

      <div 
        className="flex justify-between items-center mt-2 pt-1.5 border-t text-[10px] text-slate-500 dark:text-slate-400"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <span className="font-medium">Semestre {nodeData.semestre}</span>
        <span className="truncate max-w-[105px] font-medium text-right text-slate-600 dark:text-slate-300" title={nodeData.areaFormativa}>
          {nodeData.areaFormativa}
        </span>
      </div>

      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-2.5 h-2.5 !bg-amber-500 !border-2 !border-white dark:!border-slate-900" 
      />
    </div>
  );
});
