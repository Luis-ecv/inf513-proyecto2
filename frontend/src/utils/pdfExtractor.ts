import * as pdfjsLib from 'pdfjs-dist';

// Configurar el worker de PDF.js para Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

/**
 * Extrae el contenido de texto plano / Markdown de un archivo digital (.pdf, .md, .txt).
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  // 1. Archivos de texto directo (.md o .txt)
  if (extension === 'md' || extension === 'txt' || file.type.startsWith('text/')) {
    const rawText = await file.text();
    if (!rawText.trim()) {
      throw new Error('El archivo de texto seleccionado está vacío.');
    }
    return rawText.trim();
  }

  // 2. Archivos PDF (.pdf)
  if (extension === 'pdf' || file.type === 'application/pdf') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;

      let extractedPages: string[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Unir ítems respetando saltos de línea e intervalos de texto
        const pageLines: string[] = [];
        let currentLine = '';

        for (const item of textContent.items) {
          if ('str' in item) {
            const strItem = item as { str: string; hasEOL?: boolean };
            currentLine += (currentLine ? ' ' : '') + strItem.str;
            if (strItem.hasEOL) {
              pageLines.push(currentLine.trim());
              currentLine = '';
            }
          }
        }
        if (currentLine.trim()) {
          pageLines.push(currentLine.trim());
        }

        const pageText = pageLines.join('\n');
        if (pageText.trim()) {
          extractedPages.push(pageText.trim());
        }
      }

      const fullText = extractedPages.join('\n\n');

      if (!fullText.trim()) {
        throw new Error(
          'El archivo PDF no contiene texto digital seleccionable. Asegúrese de exportarlo directamente desde Word, Google Docs o LaTeX (no una imagen escaneada).'
        );
      }

      return fullText.trim();
    } catch (err: any) {
      if (err.message && err.message.includes('texto digital')) {
        throw err;
      }
      throw new Error(`Error al procesar el archivo PDF: ${err.message || 'Formato no legible'}`);
    }
  }

  throw new Error('Formato no compatible. Por favor suba un documento digital PDF (.pdf), Markdown (.md) o Texto (.txt).');
}
