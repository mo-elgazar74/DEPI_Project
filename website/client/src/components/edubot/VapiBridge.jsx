import Vapi from "@vapi-ai/web";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY || "";
const FALLBACK_ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID || "";

const createClient = () => {
  if (!PUBLIC_KEY) {
    return null;
  }
  try {
    return new Vapi(PUBLIC_KEY);
  } catch (error) {
    console.error("Failed to initialise Vapi client", error);
    return null;
  }
};

let sharedClient = null;

const useVapiClient = () => {
  return useMemo(() => {
    if (sharedClient) {
      return sharedClient;
    }
    sharedClient = createClient();
    return sharedClient;
  }, []);
};

export default function VapiBridge({
  active,
  apiFetch,
  isSignedIn,
  onStatusChange,
  onFallback,
}) {
  const client = useVapiClient();
  const [callStatus, setCallStatus] = useState("inactive");
  const [lastError, setLastError] = useState("");
  const startingRef = useRef(false);

  useEffect(() => {
    if (!client) {
      return;
    }
    const handleStart = () => {
      startingRef.current = false;
      setCallStatus("active");
      setLastError("");
    };
    const handleEnd = () => {
      startingRef.current = false;
      setCallStatus("inactive");
    };
    const handleError = (error) => {
      console.error("Vapi error", error);
      startingRef.current = false;
      const message = error?.message || "حدث خطأ أثناء المكالمة الصوتية.";
      setLastError(message);
      setCallStatus("inactive");
      onFallback?.(message);
    };
    client.on("call-start", handleStart);
    client.on("call-end", handleEnd);
    client.on("call-error", handleError);
    return () => {
      if (typeof client.off === "function") {
        client.off("call-start", handleStart);
        client.off("call-end", handleEnd);
        client.off("call-error", handleError);
      }
    };
  }, [client, onFallback]);

  useEffect(() => {
    onStatusChange?.(callStatus, lastError);
  }, [callStatus, lastError, onStatusChange]);

  const startCall = useCallback(async () => {
    if (!client || startingRef.current) {
      return;
    }
    if (!FALLBACK_ASSISTANT_ID) {
      const message = "لم يتم العثور على معرف المساعد VAPI.";
      setLastError(message);
      onFallback?.(message);
      return;
    }
    startingRef.current = true;
    setCallStatus("loading");
    try {
      let assistantId = FALLBACK_ASSISTANT_ID;
      let session;
      if (apiFetch) {
        try {
          const payload = await apiFetch(
            "/api/rag/live/session",
            {
              method: "POST",
              body: {
                client: {
                  userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "web",
                },
              },
            },
            isSignedIn
          );
          if (payload?.status === "error") {
            throw new Error(payload.message || "تعذر بدء جلسة Vapi.");
          }
          session = payload?.session;
          if (session?.id) {
            assistantId = session.id;
          } else if (session?.assistantId) {
            assistantId = session.assistantId;
          }
          if (session?.token && typeof client.startSession === "function") {
            await client.startSession(session);
            return;
          }
        } catch (error) {
          console.error("Failed to initialise Vapi session", error);
          const message = error?.message || "تعذر بدء جلسة Vapi.";
          setLastError(message);
          setCallStatus("inactive");
          startingRef.current = false;
          onFallback?.(message);
          return;
        }
      }
      await client.start(assistantId);
    } catch (error) {
      console.error("Failed to start Vapi call", error);
      const message = error?.message || "تعذر بدء المكالمة.";
      setLastError(message);
      setCallStatus("inactive");
      startingRef.current = false;
      onFallback?.(message);
    }
  }, [apiFetch, client, isSignedIn, onFallback]);

  const stopCall = useCallback(async () => {
    if (!client) {
      return;
    }
    try {
      startingRef.current = false;
      setCallStatus("loading");
      await client.stop();
      setCallStatus("inactive");
    } catch (error) {
      console.error("Failed to stop Vapi call", error);
      const message = error?.message || "تعذر إنهاء المكالمة.";
      setLastError(message);
      setCallStatus("inactive");
      onFallback?.(message);
    }
  }, [client, onFallback]);

  useEffect(() => {
    if (!client) {
      return;
    }
    if (active) {
      if (callStatus === "inactive") {
        startCall();
      }
    } else if (
      callStatus === "active" ||
      (callStatus === "loading" && startingRef.current)
    ) {
      stopCall();
    }
  }, [active, callStatus, client, startCall, stopCall]);

  return null;
}
