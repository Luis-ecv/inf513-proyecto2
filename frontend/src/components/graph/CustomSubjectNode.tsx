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
  let shadow = '0 1px 3px rgba(0,0,0,0.1)';
  let badgeText = '';

  if (highlight === 'selected') {
    borderStyle = '#3b82f6';
    shadow = '0 0 0 3px rgba(59, 130, 246, 0.4)';
    badgeText = 'Seleccionada';
  } else if (highlight === 'backward') {
    borderStyle = '#f59e0b';
    bgStyle = 'rgba(245, 158, 11, 0.12)';
    badgeText = '⬅ Prerrequisito';
  } else if (highlight === 'forward') {
    borderStyle = '#10b981';
    bgStyle = 'rgba(16, 185, 129, 0.12)';
    badgeText = 'Materia Bloqueada ➡';
  } else if (highlight === 'dimmed') {
    opacity = 0.35;
  }

  return (
    <div
      className="p-3 rounded-xl border transition-all text-xs w-56 select-none relative"
      style={{
        backgroundColor: bgStyle,
        borderColor: borderStyle,
        color: 'var(--text-main)',
        opacity,
        boxShadow: shadow,
      }}
    >
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-blue-500" />

      {badgeText && (
        <span 
          className="absolute -top-2.5 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border"
          style={{
            backgroundColor: highlight === 'backward' ? '#f59e0b' : highlight === 'forward' ? '#10b981' : '#3b82f6',
            color: '#ffffff',
            borderColor: 'transparent'
          }}
        >
          {badgeText}
        </span>
      )}

      <div className="flex justify-between items-center mb-1">
        <span className="font-extrabold text-sm tracking-wide text-blue-500">{nodeData.sigla}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded border opacity-80" style={{ borderColor: 'var(--border-color)' }}>
          {nodeData.creditos} cr
        </span>
      </div>

      <div className="font-semibold leading-tight line-clamp-2 h-8" title={nodeData.nombre}>
        {nodeData.nombre}
      </div>

      <div className="flex justify-between items-center mt-2 pt-1 border-t text-[10px] opacity-70" style={{ borderColor: 'var(--border-color)' }}>
        <span>Sem. {nodeData.semestre}</span>
        <span className="truncate max-w-[100px]">{nodeData.areaFormativa}</span>
      </div>

      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 bg-amber-500" />
    </div>
  );
});
