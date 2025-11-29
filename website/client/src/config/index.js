
const API_BASE = import.meta.env.VITE_API_BASE;

if (!API_BASE) {
  console.error("⚠️ VITE_API_BASE is missing!");
  console.error("🔍 Available env vars:", import.meta.env);
}

const config = {
  apiBase: API_BASE || 
    (import.meta.env.PROD 
      ? 'https://tranquil-beauty-production.up.railway.app' 
      : 'http://localhost:4000'),
  
  clerkPublishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "",
  vapiAssistantId: import.meta.env.VITE_VAPI_ASSISTANT_ID || "",
  aiUrl: import.meta.env.VITE_AI_URL || "",
  vapiPublicKey: import.meta.env.VITE_VAPI_PUBLIC_KEY || "",
  elevenlabsVoiceId: import.meta.env.VITE_ELEVENLABS_VOICE_ID || "",
  elevenlabsModelId: import.meta.env.VITE_ELEVENLABS_MODEL_ID || "",
  elevenlabsLanguage: import.meta.env.VITE_ELEVENLABS_LANGUAGE || "ar",
};

// ✅ طباعة مفصلة
console.log("📦 App Configuration:", {
  mode: import.meta.env.MODE,
  prod: import.meta.env.PROD,
  dev: import.meta.env.DEV,
  apiBase: config.apiBase,
  hasClerkKey: !!config.clerkPublishableKey,
  rawViteApiBase: import.meta.env.VITE_API_BASE,
});

export default config;