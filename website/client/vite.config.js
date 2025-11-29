import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ command, mode }) => {
  // ✅ تحميل الـ .env files بالترتيب الصحيح
  const env = loadEnv(mode, process.cwd(), '');
  
  console.log('==========================================');
  console.log('🔧 Vite Build Configuration');
  console.log('==========================================');
  console.log('📌 Command:', command);
  console.log('📌 Mode:', mode);
  console.log('📌 VITE_API_BASE:', env.VITE_API_BASE);
  console.log('📌 VITE_CLERK_PUBLISHABLE_KEY:', env.VITE_CLERK_PUBLISHABLE_KEY ? '✅ Present' : '❌ Missing');
  console.log('==========================================');
  
  // ✅ fallback للـ production
  const apiBase = env.VITE_API_BASE || 
    (mode === 'production' 
      ? 'https://tranquil-beauty-production.up.railway.app' 
      : 'http://localhost:4000');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      port: 5173,
    },
    assetsInclude: ["**/*.glb", "**/*.mp4"],
    
    define: {
      'import.meta.env.VITE_API_BASE': JSON.stringify(apiBase),
      'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(env.VITE_CLERK_PUBLISHABLE_KEY),
      'import.meta.env.VITE_VAPI_ASSISTANT_ID': JSON.stringify(env.VITE_VAPI_ASSISTANT_ID),
      'import.meta.env.VITE_AI_URL': JSON.stringify(env.VITE_AI_URL),
      'import.meta.env.VITE_VAPI_PUBLIC_KEY': JSON.stringify(env.VITE_VAPI_PUBLIC_KEY),
      'import.meta.env.VITE_ELEVENLABS_VOICE_ID': JSON.stringify(env.VITE_ELEVENLABS_VOICE_ID),
      'import.meta.env.VITE_ELEVENLABS_MODEL_ID': JSON.stringify(env.VITE_ELEVENLABS_MODEL_ID),
      'import.meta.env.VITE_ELEVENLABS_LANGUAGE': JSON.stringify(env.VITE_ELEVENLABS_LANGUAGE),
    },
    
    build: {
      sourcemap: true,
      minify: 'esbuild',
      target: 'es2015',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
  };
});