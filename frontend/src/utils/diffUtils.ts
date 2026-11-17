/**
 * Motor de Diferencias Line-by-Line estilo Git (LCS Algorithm)
 * 100% TypeScript puro, sin dependencias externas.
 */

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface DiffResult {
  lines: DiffLine[];
  stats: {
    additions: number;
    deletions: number;
    unchanged: number;
    totalLines: number;
  };
}

/**
 * Compara dos cadenas de texto y genera una estructura diff unificada línea por línea.
 */
export function computeLineDiff(oldText: string, newText: string): DiffResult {
  const oldLines = oldText ? oldText.split(/\r?\n/) : [];
  const newLines = newText ? newText.split(/\r?\n/) : [];

  const m = oldLines.length;
  const n = newLines.length;

  // Manejo de casos base
  if (m === 0 && n === 0) {
    return {
      lines: [],
      stats: { additions: 0, deletions: 0, unchanged: 0, totalLines: 0 },
    };
  }

  // Matriz DP para Longest Common Subsequence (LCS)
  // Optimizada: matriz de (m + 1) x (n + 1)
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (oldLines[i] === newLines[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // Reconstrucción del diff desde el final
  const diffLines: DiffLine[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      diffLines.push({
        type: 'unchanged',
        content: oldLines[i - 1],
        oldLineNumber: i,
        newLineNumber: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diffLines.push({
        type: 'added',
        content: newLines[j - 1],
        newLineNumber: j,
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      diffLines.push({
        type: 'removed',
        content: oldLines[i - 1],
        oldLineNumber: i,
      });
      i--;
    }
  }

  diffLines.reverse();

  let additions = 0;
  let deletions = 0;
  let unchanged = 0;

  for (const line of diffLines) {
    if (line.type === 'added') additions++;
    else if (line.type === 'removed') deletions++;
    else if (line.type === 'unchanged') unchanged++;
  }

  return {
    lines: diffLines,
    stats: {
      additions,
      deletions,
      unchanged,
      totalLines: diffLines.length,
    },
  };
}
