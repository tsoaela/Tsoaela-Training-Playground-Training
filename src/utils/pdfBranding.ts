export const TAI_ONE_LOGO_URL = '/assets/aistudio/InShot_20260522_150628190_3d2729ca.jpg';

let cachedLogoDataUrl: string | null = null;
let logoLoadPromise: Promise<string | null> | null = null;

/**
 * Loads the Tai-one official brand logo as a Base64 Data URL for client-side jsPDF
 * documents and certificates, with in-memory memoization.
 */
export async function loadLogoDataUrl(): Promise<string | null> {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  if (logoLoadPromise) return logoLoadPromise;

  logoLoadPromise = (async () => {
    try {
      const response = await fetch(TAI_ONE_LOGO_URL);
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
            canvas.width = img.naturalWidth || 256;
            canvas.height = img.naturalHeight || 256;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(null);
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', 0.92));
          } catch {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = TAI_ONE_LOGO_URL;
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
