/**
 * PNG export utilities for D3 charts.
 * SVG-based charts: serialize → canvas → PNG (no external deps)
 * HTML-based charts: html2canvas → PNG
 * Both functions stamp a semi-transparent watermark before saving.
 */

/** Stamps "visualclimate.org | Free version" at the bottom of any canvas */
function drawWatermark(ctx: CanvasRenderingContext2D, width: number, height: number, scale = 1): void {
  ctx.save();
  ctx.font       = `${14 * scale}px Inter, system-ui, sans-serif`;
  ctx.fillStyle  = 'rgba(0,0,0,0.15)';
  ctx.textAlign  = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('visualclimate.org | Free version', width / 2, height - 8 * scale);
  ctx.restore();
}

export async function exportSvgAsPng(
  svgEl: SVGSVGElement,
  filename: string,
  width = 1080,
  height = 1080,
): Promise<void> {
  const serializer = new XMLSerializer();
  let svgStr = serializer.serializeToString(svgEl);
  if (!svgStr.includes('xmlns=')) {
    svgStr = svgStr.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  const canvas = document.createElement('canvas');
  canvas.width  = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url  = URL.createObjectURL(blob);

  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      drawWatermark(ctx, width, height);
      canvas.toBlob((pngBlob) => {
        if (pngBlob) {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(pngBlob);
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(a.href), 100);
        }
        resolve();
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('SVG image load failed'));
    };
    img.src = url;
  });
}

export async function exportHtmlAsPng(
  el: HTMLElement,
  filename: string,
): Promise<void> {
  const { default: html2canvas } = await import('html2canvas');
  const rect  = el.getBoundingClientRect();
  const scale = rect.width > 0 ? Math.min(2, 1080 / rect.width) : 2;

  const canvas = await html2canvas(el, {
    scale,
    backgroundColor: '#FFFFFF',
    useCORS: true,
    logging: false,
    allowTaint: false,
  });

  const ctx = canvas.getContext('2d');
  if (ctx) drawWatermark(ctx, canvas.width, canvas.height, scale);

  canvas.toBlob((blob) => {
    if (blob) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(a.href), 100);
    }
  }, 'image/png');
}
