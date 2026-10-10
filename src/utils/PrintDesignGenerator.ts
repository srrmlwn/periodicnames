import type { NameResult } from '../types';
import { ensureCanvasFonts } from './canvasTile';
import { canvasMeasure, computePrintLayout, drawPrintDesign } from './printLayout';
import type { Placement, PrintPosition } from './printLayout';

const PRINT_PPI = 300;

export interface PrintFile {
  blob: Blob;
  position: PrintPosition;
}

export async function generatePrintFile(
  result: NameResult,
  caption: string,
  placement: Placement,
  darkShirt: boolean,
): Promise<PrintFile> {
  await ensureCanvasFonts();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const layout = computePrintLayout(result, caption, placement, canvasMeasure(ctx));

  canvas.width = Math.round(layout.widthIn * PRINT_PPI);
  canvas.height = Math.round(layout.heightIn * PRINT_PPI);
  drawPrintDesign(ctx, layout, PRINT_PPI, caption, darkShirt);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not render print file'))), 'image/png');
  });
  return { blob, position: layout.position };
}
