import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig, loadEnv  } from "vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

const rootDir = path.join(__dirname, "../../");

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  let env: Record<string, string> = {};
  try {
    env = loadEnv(mode, rootDir, '');
  } catch (e) {
    console.error("ERROR: loadEnv falló:", e);
  }

  const portFromEnv = env.FRONTEND_PORT;

  let port: number | undefined = 5173;
  if (portFromEnv) {
    const parsedPort = parseInt(portFromEnv, 10);
    if (!isNaN(parsedPort)) {
      port = parsedPort;
    } else {
      console.warn(`WARN (loadEnv): FRONTEND_PORT ('${portFromEnv}') no válido. Usando ${port}.`);
    }
  }

  const backendHost = env.URL_ADDRESS || 'localhost'; // Usa localhost como fallback
  const backendPort = env.BACKEND_PORT || '8000';    // Usa 8000 como fallback
  const backendTarget = `http://${backendHost}:${backendPort}`;

  return {
    envDir: rootDir,
    plugins: [
      TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
      tailwindcss(),
      react(),
    ],
    server: {
      port: port,
      host: true,
      proxy: {
        // Cualquier petición que empiece con /api será redirigida
        '/api': {
          // El servidor backend al que quieres redirigir
          target: backendTarget,

          // Necesario para que el backend reciba el host correcto en los headers
          // Ayuda a evitar problemas con virtual hosts o validaciones de origen
          changeOrigin: true,

          // Reescribe la ruta antes de enviarla al backend:
          // Ej: Petición del frontend a /api/users -> Petición al backend a /users
          // Quita el prefijo /api
          rewrite: (path) => path.replace(/^\/api/, '/api/v1'),

          // Si tu backend usa WebSockets (ej: Socket.IO) en la misma ruta, añade esto:
          // ws: true,
        },

        // Puedes añadir más reglas de proxy si es necesario:
        // '/otro-path': {
        //   target: 'http://otro-servidor.com',
        //   changeOrigin: true,
        //   rewrite: (path) => path.replace(/^\/otro-path/, '/nuevo-prefijo'),
        // }
      }
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
