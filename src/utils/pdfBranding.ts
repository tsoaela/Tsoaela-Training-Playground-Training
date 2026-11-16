export const TTG_LOGO_URL =
  '/assets/aistudio/Gemini_Generated_Image_3a0ub83a0ub83a0u_8153a2b2.jpeg';

// Backwards-compatible alias for existing certificate and export imports
export const TAI_ONE_LOGO_URL = TTG_LOGO_URL;

// Natural image aspect ratio (1376 x 768)
export const TTG_LOGO_ASPECT_RATIO = 1376 / 768;

let cachedLogoDataUrl: string | null = null;
let logoLoadPromise: Promise<string | null> | null = null;

/**
 * Computes aspect-preserving width/height inside a bounding box so the
 * Tsoaela Training Ground Platform logo never stretches or crops.
 */
export function getFittedLogoSize(
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (maxWidth / maxHeight > TTG_LOGO_ASPECT_RATIO) {
    return {
      width: maxHeight * TTG_LOGO_ASPECT_RATIO,
      height: maxHeight,
    };
  }
  return {
    width: maxWidth,
    height: maxWidth / TTG_LOGO_ASPECT_RATIO,
  };
}

/**
 * Loads the official Tsoaela Training Ground Platform logo as a Base64 Data URL
 * for client-side jsPDF documents and certificates, with in-memory memoization.
 */
export async function loadLogoDataUrl(): Promise<string | null> {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  if (logoLoadPromise) return logoLoadPromise;

  logoLoadPromise = (async () => {
    try {
      const response = await fetch(TTG_LOGO_URL);
      if (response.ok) {
        const blob = await response.blob();
        const dataUrl = await new Promise<string | null>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(typeof reader.result === 'string' ? reader.result : null);
          };
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
        if (dataUrl) {
          cachedLogoDataUrl = dataUrl;
          return dataUrl;
        }
      }
    } catch {
      // Fallback to Canvas Image loader below
    }

    try {
      const dataUrl = await new Promise<string | null>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || 1376;
            canvas.height = img.naturalHeight || 768;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(null);
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', 0.92));
          } catch {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = TTG_LOGO_URL;
      });
      if (dataUrl) {
        cachedLogoDataUrl = dataUrl;
      }
      return dataUrl;
    } catch {
      return null;
    }
  })();

  return logoLoadPromise;
}
