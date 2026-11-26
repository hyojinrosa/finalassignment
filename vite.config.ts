import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function mediapipeExportsPlugin(): Plugin {
  return {
    name: 'mediapipe-exports',
    transform(code, id) {
      const normalized = id.replace(/\\/g, '/');
      if (normalized.endsWith('/@mediapipe/hands/hands.js')) {
        return {
          code: `${code}\nexport const { Hands, HAND_CONNECTIONS, VERSION } = globalThis;\nexport default globalThis.Hands;\n`,
          map: null,
        };
      }
      if (normalized.endsWith('/@mediapipe/drawing_utils/drawing_utils.js')) {
        return {
          code: `${code}\nexport const { drawConnectors, drawLandmarks, drawRectangle, clamp, lerp } = globalThis;\n`,
          map: null,
        };
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), mediapipeExportsPlugin()],
  optimizeDeps: {
    exclude: ['@mediapipe/hands', '@mediapipe/drawing_utils'],
  },
});
