export function normalizarFotoUrl(raw: string | undefined): string | undefined {
  const url = raw?.trim();
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url) || /^data:image\//i.test(url)) {
    return url;
  }
  return undefined;
}

function blobADataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('invalid_data_url'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('read_failed'));
    reader.readAsDataURL(blob);
  });
}

async function convertirConCanvas(blob: Blob): Promise<string | null> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') {
    return null;
  }

  const bitmap = await createImageBitmap(blob);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.92);
  } finally {
    bitmap.close();
  }
}

/**
 * Descarga y valida la foto en el navegador antes de armar el PDF.
 * Si no carga o el formato no sirve, devuelve `null` para que el PDF salga sin foto.
 */
export async function cargarFotoParaPdf(rawUrl: string | undefined): Promise<string | null> {
  const url = normalizarFotoUrl(rawUrl);
  if (!url) return null;
  if (url.startsWith('data:image/png') || url.startsWith('data:image/jpeg')) {
    return url;
  }

  const controlador = new AbortController();
  const reloj = setTimeout(() => controlador.abort(), 5000);

  try {
    const respuesta = await fetch(url, { mode: 'cors', signal: controlador.signal });
    if (!respuesta.ok) return null;

    const blob = await respuesta.blob();
    if (!blob.size) return null;

    if (blob.type && !blob.type.startsWith('image/')) {
      return null;
    }

    if (blob.type === 'image/png' || blob.type === 'image/jpeg') {
      if (typeof createImageBitmap === 'function') {
        const bitmap = await createImageBitmap(blob);
        bitmap.close();
      }
      return await blobADataUrl(blob);
    }

    return await convertirConCanvas(blob);
  } catch {
    return null;
  } finally {
    clearTimeout(reloj);
  }
}
