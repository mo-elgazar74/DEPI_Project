import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Brain, Headphones, Loader2, Mic, Plus, Square, Trash2, Volume2, VolumeX, Home, BookOpen, BarChart2, Search, Folder, LogOut, User as UserIcon, MessageSquare, Info, X, AlertCircle, MoreVertical } from "lucide-react";
import { Button } from "@/components/edubot/ui/button";
import { Textarea } from "@/components/edubot/ui/textarea";
import { ScrollArea } from "@/components/edubot/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/edubot/ui/alert";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import logo from "@/public/logo.png"
import background from "@/public/background.png"
import VapiBridge from "@/components/edubot/VapiBridge";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
const GUEST_STATE_KEY = "edubot_guest_state_v1";
const FREE_GUEST_LIMIT = 5;
const HAS_VAPI = Boolean(
  import.meta.env.VITE_VAPI_PUBLIC_KEY && import.meta.env.VITE_VAPI_ASSISTANT_ID
);
const ELEVENLABS_VOICE_ID_CLIENT = import.meta.env.VITE_ELEVENLABS_VOICE_ID || "";
const ELEVENLABS_MODEL_ID_CLIENT = import.meta.env.VITE_ELEVENLABS_MODEL_ID || "";
const ELEVENLABS_LANGUAGE_CLIENT = import.meta.env.VITE_ELEVENLABS_LANGUAGE || "";

const defaultGuestState = { chats: [], usage: 0 };
const SpeechRecognitionClass =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;
const SPEECH_SYNTHESIS_SUPPORTED =
  typeof window !== "undefined" && typeof window.speechSynthesis !== "undefined";

const containsArabic = (text = "") => /[\u0600-\u06FF]/.test(text);
const detectLocale = (text = "") => (containsArabic(text) ? "ar-EG" : "en-US");
const detectLanguageCode = (text = "") => (containsArabic(text) ? "ar" : "en");

const readGuestState = () => {
  try {
    const raw = localStorage.getItem(GUEST_STATE_KEY);
    if (!raw) return defaultGuestState;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.chats)) {
      return defaultGuestState;
    }
    return {
      chats: parsed.chats,
      usage: Number(parsed.usage) || 0,
    };
  } catch (error) {
    console.warn("⚠️ Failed to read guest state", error);
    return defaultGuestState;
  }
};

const writeGuestState = (chats, usage) => {
  try {
    localStorage.setItem(
      GUEST_STATE_KEY,
      JSON.stringify({ chats, usage: Number(usage) || 0 })
    );
  } catch (error) {
    console.warn("⚠️ Failed to persist guest state", error);
  }
};

const makeId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

const formatRelative = (value) => {
  if (!value) return "";
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true, locale: ar });
  } catch (error) {
    return "";
  }
};

const normalizeMessages = (messages = []) =>
  messages.map((msg, index) => ({
    id: msg.id || msg.message_id || `${msg.role}-${index}-${msg.ts || Date.now()}`,
    role: msg.role === "assistant" ? "assistant" : "user",
    content: msg.content || "",
    timestamp: msg.ts || msg.timestamp || new Date().toISOString(),
    imagePreview: msg.imagePreview || "",
  }));

const markdownComponents = {
  h1: (props) => <h2 className="mb-2 text-lg font-semibold" {...props} />,
  h2: (props) => <h3 className="mb-2 text-base font-semibold" {...props} />,
  h3: (props) => <h4 className="mb-2 text-base font-semibold" {...props} />,
  h4: (props) => <h5 className="mb-2 text-sm font-semibold" {...props} />,
  p: (props) => <p className="mb-2 last:mb-0" {...props} />,
  ul: (props) => <ul className="mb-2 list-disc space-y-1 ps-5" {...props} />,
  ol: (props) => <ol className="mb-2 list-decimal space-y-1 ps-5" {...props} />,
  li: (props) => <li className="leading-relaxed" {...props} />,
  strong: (props) => <strong className="font-semibold text-current" {...props} />,
  blockquote: (props) => (
    <blockquote
      className="mb-2 border-s-4 border-[#2563eb]/40 ps-3 text-sm italic text-current/90"
      {...props}
    />
  ),
  code({ inline, className, children, ...props }) {
    if (inline) {
      return (
        <code className={cn("rounded bg-black/10 px-1 py-0.5 text-[0.9em]", className)} {...props}>
          {children}
        </code>
      );
    }
    return (
      <pre className="mb-3 overflow-x-auto rounded-2xl bg-slate-900/90 p-3 text-xs text-white">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    );
  },
};

export default function EduBotPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();

  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [bannerMessage, setBannerMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [guestUsage, setGuestUsage] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState("");
  const [isAutoSpeak, setIsAutoSpeak] = useState(false);
  const [supportsRecording, setSupportsRecording] = useState(false);
  const [interactionMode, setInteractionMode] = useState("text");
  const [liveStatus, setLiveStatus] = useState("idle");
  const [openChatMenu, setOpenChatMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuButtonRefs = useRef({});
  const [useBrowserStt, setUseBrowserStt] = useState(false);
  const [useAgenticMode, setUseAgenticMode] = useState(false);

  const messagesEndRef = useRef(null);
  const playbackRef = useRef(null);
  const lastSpokenMessageRef = useRef("");
  const speechRecognitionRef = useRef(null);

  const isGuest = useMemo(() => isLoaded && !isSignedIn, [isLoaded, isSignedIn]);
  const isGuestLimitReached = isGuest && guestUsage >= FREE_GUEST_LIMIT;
  const supportsSpeechRecognition = Boolean(SpeechRecognitionClass);

  const apiFetch = useCallback(
    async (path, options = {}, auth = false) => {
      const { method = "GET", body, headers: extraHeaders = {} } = options;
      const headers = { "Content-Type": "application/json", ...extraHeaders };

      if (auth) {
        const token = await getToken();
        if (!token) {
          throw new Error("هذه العملية تتطلب تسجيل الدخول.");
        }
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        credentials: "include",
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok || payload.status === "error") {
        const message = payload.message || payload.error || response.statusText;
        throw new Error(message);
      }

  return payload;
},
[getToken]
);

  useEffect(() => {
    setSupportsRecording(
      typeof window !== "undefined" &&
        typeof navigator !== "undefined" &&
        Boolean(navigator.mediaDevices && window.MediaRecorder)
    );
  }, []);

  const stopSpeechRecognition = useCallback(() => {
    const recognition = speechRecognitionRef.current;
    if (recognition) {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.stop();
      } catch (error) {
        // ignore
      }
      speechRecognitionRef.current = null;
    }
  }, []);

  const playWithSpeechSynthesis = useCallback(async (text) => {
    if (!SPEECH_SYNTHESIS_SUPPORTED) {
      throw new Error("speechSynthesis غير مدعوم في هذا المتصفح.");
    }
    return new Promise((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        const targetLocale = ELEVENLABS_LANGUAGE_CLIENT && ELEVENLABS_LANGUAGE_CLIENT !== "auto"
          ? ELEVENLABS_LANGUAGE_CLIENT
          : detectLocale(text);
        utterance.lang = targetLocale;
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length) {
          const preferred = voices.find((voice) => voice.lang?.toLowerCase() === targetLocale.toLowerCase());
          if (preferred) {
            utterance.voice = preferred;
          } else {
            const altLocale = containsArabic(text) ? "ar" : "en";
            const fallbackVoice = voices.find((voice) => voice.lang?.toLowerCase().startsWith(altLocale));
            if (fallbackVoice) {
              utterance.voice = fallbackVoice;
            }
          }
        }
        utterance.onend = resolve;
        utterance.onerror = (event) => reject(event.error || new Error("تعذر تشغيل الصوت."));
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        reject(error);
      }
    });
  }, []);

  const loadChats = useCallback(async () => {
    if (!isLoaded) return;

    if (isSignedIn) {
      setLoadingChats(true);
      try {
        const data = await apiFetch("/api/rag/history", {}, true);
        const normalized = (data.chats || []).map((chat) => ({
          id: chat.chat_id || chat.id,
          title: chat.title || "محادثة بدون عنوان",
          created_at: chat.created_at,
          updated_at: chat.updated_at,
        }));
        setChats(normalized);
        if (!normalized.length) {
          setCurrentChatId(null);
          setMessages([]);
        } else if (!normalized.some((chat) => chat.id === currentChatId)) {
          setCurrentChatId(normalized[0].id);
        }
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setLoadingChats(false);
      }
    } else {
      const state = readGuestState();
      setChats(state.chats);
      setGuestUsage(state.usage);
      if (!state.chats.length) {
        setCurrentChatId(null);
        setMessages([]);
      } else if (!state.chats.some((chat) => chat.id === currentChatId)) {
        setCurrentChatId(state.chats[0].id);
      }
    }
  }, [apiFetch, currentChatId, isLoaded, isSignedIn]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const stopPlayback = useCallback(() => {
    if (playbackRef.current) {
      playbackRef.current.pause();
      playbackRef.current = null;
    }
  }, []);

  const handleLiveFallback = useCallback(
    (message) => {
      toast({
        title: "⚠️ Live call unavailable",
        description: message || "Switching to recorded voice mode.",
      });
      setLiveStatus("inactive");
      setInteractionMode("record");
    },
    [toast]
  );

  const handleLiveStatusChange = useCallback(
    (status, errorMessage) => {
      setLiveStatus(status);
      if (errorMessage) {
        toast({ title: "⚠️ مكالمة Vapi", description: errorMessage });
      }
      if (status === "inactive" && interactionMode === "live") {
        setInteractionMode("text");
      }
    },
    [interactionMode, toast]
  );

  const requestTtsPlayback = useCallback(
    async (text) => {
      if (!text) return;
      try {
        stopPlayback();
        await playWithSpeechSynthesis(text);
      } catch (error) {
        console.error("Speech synthesis failed", error);
        setErrorMessage((prev) => prev || error.message || "تعذر تشغيل الصوت.");
      }
    },
    [playWithSpeechSynthesis, stopPlayback]
  );

  const playAssistantAudio = useCallback(
    async (message) => {
      if (!message) return;
      await requestTtsPlayback(message.content);
    },
    [requestTtsPlayback]
  );

  const appendGuestMessage = useCallback(
    (chatId, message) => {
      const messageForStorage = { ...message };
      delete messageForStorage.imagePreview;
      setChats((prev) => {
        const next = prev.map((chat) => {
          if (chat.id !== chatId) return chat;
          const updatedMessages = [...(chat.messages || []), messageForStorage];
          const titleNeedsUpdate = chat.title === "محادثة جديدة" && messageForStorage.role === "user";
          return {
            ...chat,
            messages: updatedMessages,
            updated_at: message.timestamp,
            title: titleNeedsUpdate ? makeTitleFromQuestion(messageForStorage.content) : chat.title,
          };
        });
        writeGuestState(next, guestUsage);
        return next;
      });
    },
    [guestUsage]
  );

  const fetchChatDetail = useCallback(
    async (chatId) => {
      if (!isSignedIn || !chatId) return;
      try {
        const data = await apiFetch(`/api/rag/chat/${chatId}`, {}, true);
        const chat = data.chat || {};
        const normalized = normalizeMessages(chat.messages || []);
        setMessages(normalized);
      } catch (error) {
        setErrorMessage(error.message);
      }
    },
    [apiFetch, isSignedIn]
  );

  useEffect(() => {
    if (isSignedIn && currentChatId) {
      fetchChatDetail(currentChatId);
    }
  }, [currentChatId, fetchChatDetail, isSignedIn]);

  const ensureActiveChat = useCallback(async () => {
    if (currentChatId) return currentChatId;
    if (isSignedIn) {
      try {
        const data = await apiFetch(
          "/api/rag/chat/new",
          { method: "POST", body: {} },
          true
        );
        const chatId = data.chat_id || data.chatId || data.id;
        await loadChats();
        setCurrentChatId(chatId);
        setMessages([]);
        return chatId;
      } catch (error) {
        setErrorMessage(error.message);
        throw error;
      }
    } else {
      const now = new Date().toISOString();
      const chatId = makeId();
      const newChat = {
        id: chatId,
        title: "محادثة جديدة",
        created_at: now,
        updated_at: now,
        messages: [],
      };
      setChats((prev) => {
        const next = [newChat, ...prev];
        writeGuestState(next, guestUsage);
        return next;
      });
      setCurrentChatId(chatId);
      setMessages([]);
      return chatId;
    }
  }, [apiFetch, currentChatId, guestUsage, isSignedIn, loadChats]);

  const submitTranscribedQuestion = useCallback(
    async (questionText) => {
      const trimmed = (questionText || "").trim();
      if (!trimmed) {
        setRecordingError("لم يتم التعرف على أي نص من الصوت.");
        return;
      }

      try {
        const chatId = await ensureActiveChat();
        if (!chatId) {
          return;
        }

        const timestamp = new Date().toISOString();
        const userMessage = {
          id: makeId(),
          role: "user",
          content: trimmed,
          timestamp,
        };
        setMessages((prev) => [...prev, userMessage]);
        if (!isSignedIn) {
          appendGuestMessage(chatId, userMessage);
        }

        const body = { question: trimmed, mode_flag: useAgenticMode ? 1 : 0 };

        if (isSignedIn) {
          await apiFetch(
            `/api/rag/chat/${chatId}/ask`,
            {
              method: "POST",
              body,
            },
            true
          );
          await fetchChatDetail(chatId);
        } else {
          const payload = await apiFetch(
            "/api/rag/ask",
            {
              method: "POST",
              body,
            },
            false
          );
          const assistantResponse = payload.answer || "";
          const assistantMessage = {
            id: makeId(),
            role: "assistant",
            content: assistantResponse,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
          appendGuestMessage(chatId, assistantMessage);
          if (isAutoSpeak) {
            await playAssistantAudio(assistantMessage);
          }
        }
      } catch (error) {
      toast({
        title: "⚠️ تعذر معالجة النص",
          description: error.message || "حاول مرة أخرى لاحقًا.",
        });
      } finally {
        setIsRecording(false);
        setInteractionMode("text");
      }
    },
    [apiFetch, appendGuestMessage, ensureActiveChat, fetchChatDetail, isAutoSpeak, isSignedIn, playAssistantAudio, toast, useAgenticMode]
  );

  const startSpeechRecognition = useCallback(() => {
    if (!supportsSpeechRecognition) {
      setRecordingError("التعرف على الصوت غير مدعوم في هذا المتصفح.");
      return;
    }
    try {
      stopSpeechRecognition();
      const recognition = new SpeechRecognitionClass();
      recognition.lang = ELEVENLABS_LANGUAGE_CLIENT || "ar-SA";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognitionRef.current = recognition;
      setIsRecording(true);
      setInteractionMode("record");
      setRecordingError("");

      recognition.onresult = async (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || "";
        await submitTranscribedQuestion(transcript);
      };
      recognition.onerror = (event) => {
        setRecordingError(event.error || event.message || "تعذر التعرف على الصوت.");
        setIsRecording(false);
        setInteractionMode("text");
      };
      recognition.onend = () => {
        speechRecognitionRef.current = null;
        setIsRecording(false);
        setInteractionMode("text");
      };
      recognition.start();
    } catch (error) {
      console.error("Speech recognition failed", error);
      setRecordingError(error.message || "تعذر بدء التعرف على الصوت.");
      setIsRecording(false);
      setInteractionMode("text");
    }
  }, [submitTranscribedQuestion, supportsSpeechRecognition, stopSpeechRecognition]);

  const stopRecording = useCallback(() => {
    stopSpeechRecognition();
    setIsRecording(false);
    setInteractionMode((prev) => (prev === "record" ? "text" : prev));
  }, [stopSpeechRecognition]);

  const startRecording = useCallback(async () => {
    if (isRecording) {
      return;
    }
    if (!supportsSpeechRecognition) {
      setRecordingError("التعرف على الصوت غير متاح على هذا المتصفح.");
      return;
    }
    setUseBrowserStt(true);
    startSpeechRecognition();
  }, [isRecording, startSpeechRecognition, supportsSpeechRecognition]);

  const handleRecordToggle = useCallback(() => {
    if (isRecording) {
      stopRecording();
      setInteractionMode("text");
      return;
    }
    if (useBrowserStt || !supportsRecording) {
      if (supportsSpeechRecognition) {
        startSpeechRecognition();
      } else {
        setRecordingError("التعرف على الصوت غير متاح على هذا المتصفح.");
      }
      return;
    }
    startRecording();
  }, [isRecording, startRecording, stopRecording, supportsRecording, supportsSpeechRecognition, useBrowserStt, startSpeechRecognition]);

  const handleLiveToggle = useCallback(() => {
    if (!HAS_VAPI) {
      toast({
        title: "⚠️ وضع المكالمة غير متوفر",
        description: "يرجى التأكد من إعداد مفاتيح Vapi.",
      });
      return;
    }
    if (interactionMode === "live" || liveStatus === "active" || liveStatus === "loading") {
      setInteractionMode("text");
    } else {
      stopRecording();
      setUseBrowserStt(false);
      setInteractionMode("live");
    }
  }, [interactionMode, liveStatus, stopRecording, toast]);

  useEffect(
    () => () => {
      stopRecording();
      stopPlayback();
    },
    [stopPlayback, stopRecording]
  );

  useEffect(() => {
    if (!isLoaded) return;
    let msg = "";
    if (isSignedIn) {
      msg = "مرحبًا بك! يمكنك متابعة محادثاتك مع EduBot.";
    } else {
      msg = "أنت تستخدم EduBot كضيف. لديك خمسة أسئلة مجانية، سجّل الدخول للاحتفاظ بمحادثاتك.";
    }
    setBannerMessage(msg);

    const timer = setTimeout(() => {
      setBannerMessage("");
    }, 5000);

    return () => clearTimeout(timer);
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openChatMenu && !event.target.closest('.chat-menu-container')) {
        setOpenChatMenu(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openChatMenu]);

  useEffect(() => {
    if (!isSignedIn && currentChatId) {
      const state = readGuestState();
      const chat = state.chats.find((item) => item.id === currentChatId);
      setMessages(chat?.messages || []);
    }
  }, [currentChatId, isSignedIn, chats]);

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "assistant" || liveStatus === "active") {
      return;
    }
    if (lastMessage.id === lastSpokenMessageRef.current) {
      return;
    }
    lastSpokenMessageRef.current = lastMessage.id;
    if (isAutoSpeak && !lastMessage.content.startsWith("⚠️")) {
      playAssistantAudio(lastMessage);
    }
  }, [isAutoSpeak, liveStatus, messages, playAssistantAudio]);

  const handleNewChat = useCallback(async () => {
    setErrorMessage("");
    if (isSignedIn) {
      try {
        const data = await apiFetch(
          "/api/rag/chat/new",
          { method: "POST", body: {} },
          true
        );
        const chatId = data.chat_id || data.chatId || data.id;
        await loadChats();
        setCurrentChatId(chatId);
        setMessages([]);
      } catch (error) {
        setErrorMessage(error.message);
      }
    } else {
      const now = new Date().toISOString();
      const chatId = makeId();
      const newChat = {
        id: chatId,
        title: "محادثة جديدة",
        created_at: now,
        updated_at: now,
        messages: [],
      };
      setChats((prev) => {
        const next = [newChat, ...prev];
        writeGuestState(next, guestUsage);
        return next;
      });
      setCurrentChatId(chatId);
      setMessages([]);
    }
  }, [apiFetch, guestUsage, isSignedIn, loadChats]);

  const openChat = useCallback((chatId) => {
    setErrorMessage("");
    setCurrentChatId(chatId);
  }, []);

const handleDeleteChat = useCallback(async () => {
    if (!currentChatId) return;
    const confirmDelete = window.confirm("هل تريد حذف هذه المحادثة نهائيًا؟");
    if (!confirmDelete) return;

    if (isSignedIn) {
      try {
        await apiFetch(`/api/rag/chat/${currentChatId}`, { method: "DELETE" }, true);
        await loadChats();
        setCurrentChatId(null);
        setMessages([]);
      } catch (error) {
        setErrorMessage(error.message);
      }
    } else {
      setChats((prev) => {
        const next = prev.filter((chat) => chat.id !== currentChatId);
        writeGuestState(next, guestUsage);
        return next;
      });
      setCurrentChatId(null);
      setMessages([]);
    }
  }, [apiFetch, currentChatId, guestUsage, isSignedIn, loadChats]);

  const makeTitleFromQuestion = (text) => {
    const trimmed = (text || "").trim();
    if (!trimmed) return "محادثة جديدة";
    return trimmed.length > 40 ? `${trimmed.slice(0, 40)}…` : trimmed;
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : "";
        const base64 = result.split(",")[1] || "";
        resolve({ base64, dataUrl: result });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImageBase64("");
      setImagePreview("");
      return;
    }
    if (!file.type.startsWith("image")) {
      setErrorMessage("يرجى اختيار صورة صالحة.");
      return;
    }
    try {
      const { base64, dataUrl } = await fileToBase64(file);
      setImageBase64(base64);
      setImagePreview(dataUrl);
      setErrorMessage("");
    } catch (error) {
      console.error("Failed to read image", error);
      setErrorMessage("تعذر تحميل الصورة.");
    }
    event.target.value = "";
  };

  const clearImageAttachment = () => {
    setImageBase64("");
    setImagePreview("");
  };

  const sendQuestion = useCallback(async () => {
    const trimmed = question.trim();
    const hasImage = Boolean(imageBase64);
    if (!trimmed && hasImage) {
      setErrorMessage("يرجى كتابة سؤال قصير يصف الصورة قبل الإرسال.");
      return;
    }
    if ((!trimmed && !hasImage) || loadingMessage || isGuestLimitReached) {
      return;
    }

    if (isRecording) {
      stopRecording();
    }
    stopPlayback();
    setInteractionMode("text");

    setErrorMessage("");
    setQuestion("");

    const timestamp = new Date().toISOString();
    const displayContent = [trimmed, hasImage ? "[صورة مرفقة]" : null]
      .filter(Boolean)
      .join("\n");
    const userMessage = {
      id: makeId(),
      role: "user",
      content: displayContent || "[صورة مرفقة]",
      timestamp,
      imagePreview,
    };

    const chatId = await ensureActiveChat();
    if (!chatId) {
      clearImageAttachment();
      return;
    }

    setMessages((prev) => [...prev, userMessage]);
    if (!isSignedIn) {
      appendGuestMessage(chatId, userMessage);
    }

    setLoadingMessage(true);

    const requestBody = {
      question: trimmed,
      ...(hasImage ? { image_base64: imageBase64 } : {}),
      mode_flag: useAgenticMode ? 1 : 0,
    };

    try {
      if (isSignedIn) {
        await apiFetch(
          `/api/rag/chat/${chatId}/ask`,
          {
            method: "POST",
            body: requestBody,
          },
          true
        );
        await fetchChatDetail(chatId);
        await loadChats();
      } else {
        const payload = await apiFetch(
          "/api/rag/ask",
          {
            method: "POST",
            body: requestBody,
          },
          false
        );
        const newUsage = guestUsage + 1;
        setGuestUsage(newUsage);
        const state = readGuestState();
        writeGuestState(state.chats, newUsage);

        const assistantResponse = payload.answer || "لم يتم العثور على إجابة.";
        const assistantMessage = {
          id: makeId(),
          role: "assistant",
          content: assistantResponse,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        appendGuestMessage(chatId, assistantMessage);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          content: `⚠️ ${error.message}`,
          timestamp: new Date().toISOString(),
        },
      ]);
      setErrorMessage(error.message);
    } finally {
      setLoadingMessage(false);
      clearImageAttachment();
    }
  }, [
    appendGuestMessage,
    apiFetch,
    ensureActiveChat,
    fetchChatDetail,
    guestUsage,
    imageBase64,
    imagePreview,
    isGuestLimitReached,
    isSignedIn,
    loadChats,
    loadingMessage,
    question,
    isRecording,
    stopPlayback,
    stopRecording,
    useAgenticMode,
  ]);

  const activeChat = useMemo(() => {
    if (!currentChatId) return null;
    return chats.find((chat) => (chat.id || chat.chat_id) === currentChatId) || null;
  }, [chats, currentChatId]);

  return (
    <>
      {/* Error Toast Notification */}
      {errorMessage && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-right fade-in duration-300">
          <div className="bg-white border-l-4 border-red-500 shadow-lg rounded-lg p-4 max-w-sm w-full flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">خطأ</h3>
              <p className="text-sm text-gray-600 leading-relaxed" dir="auto">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage("")}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Guest Limit Toast Notification */}
      {isGuestLimitReached && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-right fade-in duration-300">
          <div className="bg-white border-l-4 border-amber-500 shadow-lg rounded-lg p-4 max-w-sm w-full flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">تنبيه</h3>
              <p className="text-sm text-gray-600 leading-relaxed" dir="auto">لقد استخدمت الحد الأقصى للأسئلة المجانية. سجّل الدخول للاستمرار في استخدام EduBot.</p>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {bannerMessage && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-right fade-in duration-300">
          <div className="bg-white border-l-4 border-blue-500 shadow-lg rounded-lg p-4 max-w-sm w-full flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">ملاحظة</h3>
              <p className="text-sm text-gray-600 leading-relaxed" dir="auto">{bannerMessage}</p>
            </div>
            <button
              onClick={() => setBannerMessage("")}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <VapiBridge
        active={HAS_VAPI && interactionMode === "live"}
        apiFetch={apiFetch}
        isSignedIn={isSignedIn}
        onStatusChange={handleLiveStatusChange}
        onFallback={handleLiveFallback}
      />
      <div className="h-screen bg-[#f5f7fb] p-4 overflow-hidden">
        <div className="flex h-full gap-4">
        <aside className="w-64 h-full bg-[#eaf4fc] flex flex-col border border-blue-100 rounded-2xl shadow-sm">
          {/* Sidebar Header */}
          <div className="p-6 flex flex-col items-center border-b border-blue-100/50">
            <div className="mb-4 text-center">
                 <img src={logo} alt="EduBot" className="w-36 h-36  mx-auto flex items-center justify-center mb-1" />
              <h1 className="text-xl font-bold text-blue-900">EduBot Egypt</h1>
            </div>
            
            <div className="w-full flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-blue-100">
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-6 h-6 m-2 text-gray-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{user?.fullName || "Guest User"}</p>
                <p className="text-xs text-gray-500">G2 / T1</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="p-4 space-y-2">
            <button onClick={handleNewChat} className="w-full flex items-center gap-3 px-4 py-3 bg-blue-100/50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors">
              <Plus className="w-5 h-5" />
              <span className="font-semibold">New Chat</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-blue-50 rounded-xl transition-colors">
              <Search className="w-5 h-5" />
              <span className="font-medium">Search Chat</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-blue-50 rounded-xl transition-colors">
              <Folder className="w-5 h-5" />
              <span className="font-medium">Projects</span>
            </button>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            <h3 className="text-xs font-semibold text-gray-400 mb-2 px-2">Chats</h3>
            {loadingChats ? (
              <div className="flex justify-center p-4">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              </div>
            ) : (
              <ul className="space-y-1">
                {chats.map((chat) => {
                  const chatId = chat.id || chat.chat_id;
                  const isActive = chatId === currentChatId;
                  return (
                    <li key={chatId} className="relative group">
                      <button
                        onClick={() => openChat(chatId)}
                        className={cn(
                          "w-full text-left px-4 py-2 rounded-lg text-sm transition-colors truncate pr-10",
                          isActive
                            ? "bg-blue-200/50 text-blue-900 font-medium"
                            : "text-gray-600 hover:bg-blue-50"
                        )}
                      >
                        {chat.title || "محادثة جديدة"}
                      </button>
                      
                      {/* 3-dots button */}
                      <button
                        ref={(el) => { menuButtonRefs.current[chatId] = el; }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = menuButtonRefs.current[chatId]?.getBoundingClientRect();
                          if (rect) {
                            setMenuPosition({
                              top: rect.bottom + 8,
                              left: rect.right - 12,
                            });
                          }
                          setOpenChatMenu(openChatMenu === chatId ? null : chatId);
                        }}
                        className="chat-menu-trigger absolute right-2 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 hover:bg-blue-100 rounded transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Bottom Nav */}
          <div className="p-4 border-t border-blue-100 grid grid-cols-3 gap-2">
            <button className="flex flex-col items-center gap-1 p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
              <Home className="w-5 h-5" />
              <span className="text-[10px] font-medium">Home</span>
            </button>
            <button className="flex flex-col items-center gap-1 p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg">
              <BookOpen className="w-5 h-5" />
              <span className="text-[10px] font-medium">Subject</span>
            </button>
            <button className="flex flex-col items-center gap-1 p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg">
              <BarChart2 className="w-5 h-5" />
              <span className="text-[10px] font-medium">Progress</span>
            </button>
          </div>
        </aside>

        <section className="flex flex-1 flex-col h-full bg-white border border-blue-100 rounded-2xl shadow-sm overflow-hidden">

          <main className="flex-1 overflow-y-auto px-6 bg-[#f8fbfe]" style={{ backgroundImage: `url(${background})` }}>
            <div className="max-w-4xl mx-auto pt-6">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center opacity-50">
                   <img src={logo} alt="EduBot" className="w-42 h-42 mb-4" />
                   <p className="text-xl font-medium text-blue-900">كيف يمكنني مساعدتك اليوم؟</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex w-full",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] px-5 py-3 text-sm leading-relaxed shadow-sm relative",
                          msg.role === "user"
                            ? "bg-[#8AB6F9] text-[#0F1C3F] rounded-t-2xl rounded-bl-2xl"
                            : "bg-[#e1effe] text-[#1e3a8a] rounded-t-2xl rounded-br-2xl"
                        )}
                        dir="auto"
                      >
                        {msg.imagePreview && (
                          <img
                            src={msg.imagePreview}
                            alt="صورة مرفقة"
                            className="mb-2 max-h-48 rounded-lg object-contain bg-black/10"
                          />
                        )}
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          className={cn(
                            "space-y-2 text-sm leading-relaxed",
                            msg.role === "user"
                              ? "text-[#0F1C3F] [&_strong]:text-[#0F1C3F]"
                              : "text-[#1e3a8a]"
                          )}
                        >
                          {msg.content}
                        </ReactMarkdown>
                        
                        {msg.role === "assistant" && !msg.content.startsWith("⚠️") && (
                          <button
                            type="button"
                            onClick={() => playAssistantAudio(msg)}
                            className="absolute -bottom-6 left-0 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {loadingMessage && (
                    <div className="flex justify-start w-full">
                       <div className="bg-[#e1effe] text-[#1e3a8a] rounded-t-2xl rounded-br-2xl px-5 py-3 shadow-sm flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>جاري الكتابة...</span>
                       </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </main>

          {/* Input Area - Sticky at bottom */}
          <div className="px-6 pb-2 bg-[#f8fbfe]" style={{ backgroundBlendMode: "multiply" }}>
              <div className="relative flex flex-col border border-gray-200 rounded-xl shadow-sm" style={{backgroundBlendMode: "multiply"}}>
                  <textarea
                    dir="auto"
                    rows="1"
                    style={{ overflow: "hidden", outline: "none" }}
                    className="w-full px-4 py-2 resize-none bg-transparent border-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400 align-top leading-normal min-h-[50px] text-gray-900 text-right font-medium"
                      placeholder="اسألني أي شيء..."
                      value={question}
                      onChange={(event) => setQuestion(event.target.value)}
                      onKeyDown={(event) => {
                        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                          event.preventDefault();
                          sendQuestion();
                        }
                      }}
                      disabled={loadingMessage || isGuestLimitReached}
                    ></textarea>
                  
                  {imagePreview && (
                    <div className="px-4 pb-2">
                      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
                        <div className="flex items-center gap-3">
                          <img src={imagePreview} alt="معاينة الصورة" className="h-10 w-10 rounded object-cover" />
                          <span className="text-gray-600">صورة مرفقة</span>
                        </div>
                        <button 
                          onClick={clearImageAttachment}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="h-10">
                    <div className="absolute left-3 right-3 bottom-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {/* File Attachment */}
                        <label className={cn("cursor-pointer", isGuestLimitReached && "opacity-50 cursor-not-allowed")}>
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleImageChange}
                            disabled={loadingMessage || isGuestLimitReached}
                          />
                          <div
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg border border-gray-100 hover:border-blue-100 hover:bg-blue-50"
                            aria-label="Attach file"
                          >
                            <svg
                              className="w-4 h-4"
                              strokeLinejoin="round"
                              strokeLinecap="round"
                              strokeWidth="2"
                              stroke="currentColor"
                              fill="none"
                              viewBox="0 0 24 24"
                              height="16"
                              width="16"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                            </svg>
                          </div>
                        </label>

                        {/* Mic Recording */}
                        {supportsRecording && (
                          <button
                            type="button"
                            className={cn(
                              "p-2 transition-colors rounded-lg border border-gray-100 hover:border-blue-100 hover:bg-blue-50",
                              isRecording ? "text-red-500 border-red-500/50 bg-red-500/10" : "text-gray-400 hover:text-blue-600"
                            )}
                            onClick={handleRecordToggle}
                            disabled={loadingMessage || isGuestLimitReached}
                            title={isRecording ? "إيقاف التسجيل" : "تسجيل صوتي"}
                          >
                            {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
                          </button>
                        )}

                        {/* Live Mode */}
                        {HAS_VAPI && (
                          <button
                            type="button"
                            className={cn(
                              "p-2 transition-colors rounded-lg border border-gray-100 hover:border-blue-100 hover:bg-blue-50",
                              (interactionMode === "live" || liveStatus === "active") 
                                ? "text-emerald-500 border-emerald-500/50 bg-emerald-500/10" 
                                : "text-gray-400 hover:text-blue-600",
                              liveStatus === "active" && "animate-pulse"
                            )}
                            onClick={handleLiveToggle}
                            disabled={loadingMessage || isGuestLimitReached}
                            title="مكالمة مباشرة"
                          >
                            <Headphones className="w-4 h-4" />
                          </button>
                        )}

                        {/* Auto Speak */}
                        <button
                          type="button"
                          className={cn(
                            "p-2 transition-colors rounded-lg border border-gray-100 hover:border-blue-100 hover:bg-blue-50",
                            isAutoSpeak ? "text-blue-500 border-blue-500/50 bg-blue-500/10" : "text-gray-400 hover:text-blue-600"
                          )}
                          onClick={() => setIsAutoSpeak((prev) => !prev)}
                          title="القراءة التلقائية"
                        >
                          {isAutoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </button>

                        {/* Agentic Mode */}
                        <button
                          type="button"
                          className={cn(
                            "p-2 transition-colors rounded-lg border border-gray-100 hover:border-blue-100 hover:bg-blue-50",
                            useAgenticMode ? "text-purple-500 border-purple-500/50 bg-purple-500/10" : "text-gray-400 hover:text-blue-600"
                          )}
                          onClick={() => setUseAgenticMode((prev) => !prev)}
                          title="وضع التفكير العميق"
                        >
                          <Brain className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Send Button */}
                      <button
                        className={cn(
                          "p-2 transition-colors text-blue-500 hover:text-blue-600",
                          (!question.trim() && !imageBase64) || loadingMessage || isGuestLimitReached ? "opacity-50 cursor-not-allowed" : ""
                        )}
                        aria-label="Send message"
                        type="button"
                        onClick={sendQuestion}
                        disabled={(!question.trim() && !imageBase64) || loadingMessage || isGuestLimitReached}
                      >
                        {loadingMessage ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <svg
                            className="w-6 h-6"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            strokeWidth="2"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 24 24"
                            height="24"
                            width="24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <circle r="10" cy="12" cx="12"></circle>
                            <path d="m16 12-4-4-4 4"></path>
                            <path d="M12 16V8"></path>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1 text-xs px-4 mt-2 pb-0 mb-0">
                  {isRecording && <span className="text-amber-600">جاري التسجيل... تحدث الآن ثم اضغط إيقاف.</span>}
                  {recordingError && <span className="text-red-500">{recordingError}</span>}
                  {isGuest && (
                    <span className="text-muted-foreground">
                      عدد الأسئلة المتبقية: {Math.max(FREE_GUEST_LIMIT - guestUsage, 0)} من {FREE_GUEST_LIMIT}
                    </span>
                  )}
                </div>
              </div>
        </section>
      </div>
    </div>
    
    {/* Portal-based menu */}
    {openChatMenu && createPortal(
      <div
        className="fixed inset-0 z-[9999] chat-menu-container"
        onClick={() => setOpenChatMenu(null)}
      >
        <div
          className="absolute"
          style={{ top: menuPosition.top, left: menuPosition.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white shadow-2xl border border-gray-200 rounded-xl py-2 min-w-[190px]">
            <button
              onClick={() => {
                const id = openChatMenu;
                setOpenChatMenu(null);
                if (id !== currentChatId) {
                  openChat(id);
                }
                handleDeleteChat();
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف المحادثة</span>
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
