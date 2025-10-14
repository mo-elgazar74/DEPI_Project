import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/edubot/ui/button";
import { Textarea } from "@/components/edubot/ui/textarea";
import { ScrollArea } from "@/components/edubot/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/edubot/ui/alert";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
const GUEST_STATE_KEY = "edubot_guest_state_v1";
const FREE_GUEST_LIMIT = 5;

const defaultGuestState = { chats: [], usage: 0 };

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
  }));

export default function EduBotPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();

  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [bannerMessage, setBannerMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [guestUsage, setGuestUsage] = useState(0);

  const messagesEndRef = useRef(null);

  const isGuest = useMemo(() => isLoaded && !isSignedIn, [isLoaded, isSignedIn]);
  const isGuestLimitReached = isGuest && guestUsage >= FREE_GUEST_LIMIT;

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
    if (!isLoaded) return;
    if (isSignedIn) {
      setBannerMessage("مرحبًا بك! يمكنك متابعة محادثاتك مع EduBot.");
    } else {
      setBannerMessage(
        "أنت تستخدم EduBot كضيف. لديك خمسة أسئلة مجانية، سجّل الدخول للاحتفاظ بمحادثاتك."
      );
    }
  }, [isLoaded, isSignedIn]);

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

  const makeTitleFromQuestion = (text) => {
    const trimmed = (text || "").trim();
    if (!trimmed) return "محادثة جديدة";
    return trimmed.length > 40 ? `${trimmed.slice(0, 40)}…` : trimmed;
  };

  const appendGuestMessage = useCallback(
    (chatId, message) => {
      setChats((prev) => {
        const next = prev.map((chat) => {
          if (chat.id !== chatId) return chat;
          const updatedMessages = [...(chat.messages || []), message];
          const titleNeedsUpdate = chat.title === "محادثة جديدة" && message.role === "user";
          return {
            ...chat,
            messages: updatedMessages,
            updated_at: message.timestamp,
            title: titleNeedsUpdate ? makeTitleFromQuestion(message.content) : chat.title,
          };
        });
        writeGuestState(next, guestUsage);
        return next;
      });
    },
    [guestUsage]
  );

  const sendQuestion = useCallback(async () => {
    const trimmed = question.trim();
    if (!trimmed || loadingMessage || isGuestLimitReached) {
      return;
    }

    setErrorMessage("");
    setQuestion("");

    const timestamp = new Date().toISOString();
    const userMessage = {
      id: makeId(),
      role: "user",
      content: trimmed,
      timestamp,
    };

    const chatId = await ensureActiveChat();
    if (!chatId) {
      return;
    }

    setMessages((prev) => [...prev, userMessage]);
    if (!isSignedIn) {
      appendGuestMessage(chatId, userMessage);
    }

    setLoadingMessage(true);

    try {
      if (isSignedIn) {
        await apiFetch(
          `/api/rag/chat/${chatId}/ask`,
          {
            method: "POST",
            body: { question: trimmed },
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
            body: { question: trimmed },
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
    }
  }, [
    appendGuestMessage,
    apiFetch,
    ensureActiveChat,
    fetchChatDetail,
    guestUsage,
    isGuestLimitReached,
    isSignedIn,
    loadChats,
    loadingMessage,
    question,
  ]);

  const activeChat = useMemo(() => {
    if (!currentChatId) return null;
    return chats.find((chat) => (chat.id || chat.chat_id) === currentChatId) || null;
  }, [chats, currentChatId]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f5f7fb]">
      <div className="flex h-full">
        <aside className="w-72 border-l bg-white flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-[#1f2a44]">محادثاتي</h2>
              <Button size="icon" variant="secondary" onClick={handleNewChat} disabled={loadingChats}>
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            {loadingChats ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> جاري تحميل المحادثات...
              </div>
            ) : chats.length === 0 ? (
              <div className="flex h-full items-center justify-center px-4 text-center text-muted-foreground">
                لا توجد محادثة بعد. ابدأ محادثة جديدة مع EduBot.
              </div>
            ) : (
              <ScrollArea className="h-full">
                <ul className="space-y-1 p-2">
                  {chats.map((chat) => {
                    const chatId = chat.id || chat.chat_id;
                    const isActive = chatId === currentChatId;
                    return (
                      <li key={chatId}>
                        <button
                          type="button"
                          onClick={() => openChat(chatId)}
                          className={cn(
                            "w-full rounded-xl px-3 py-2 text-right transition",
                            isActive
                              ? "bg-[#1f2a44] text-white shadow"
                              : "bg-white text-[#1f2a44] hover:bg-[#e9edf6]"
                          )}
                        >
                          <div className="text-sm font-semibold">
                            {chat.title || "محادثة بدون عنوان"}
                          </div>
                          <div className="text-xs text-white/80 md:text-white/70">
                            {formatRelative(chat.updated_at || chat.created_at)}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            )}
          </div>
        </aside>

        <section className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b bg-white px-6 py-4">
            <div>
              <h1 className="text-xl font-semibold text-[#1f2a44]">EduBot</h1>
              <p className="text-sm text-muted-foreground">
                {activeChat ? activeChat.title : "اختر محادثة أو ابدأ جديدة"}
              </p>
            </div>
            {currentChatId && (
              <Button
                variant="ghost"
                className="text-destructive"
                onClick={handleDeleteChat}
                size="sm"
              >
                <Trash2 className="ml-2 h-4 w-4" /> حذف المحادثة
              </Button>
            )}
          </header>

          <div className="px-6 pt-4">
            {bannerMessage && (
              <Alert className="mb-3 border border-[#1f2a44]/10 bg-[#f0f3ff] text-[#1f2a44]">
                <AlertDescription>{bannerMessage}</AlertDescription>
              </Alert>
            )}
            {errorMessage && (
              <Alert variant="destructive" className="mb-3">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            {isGuestLimitReached && (
              <Alert variant="destructive" className="mb-3">
                <AlertDescription>
                  لقد استخدمت الحد الأقصى للأسئلة المجانية. سجّل الدخول للاستمرار في استخدام EduBot.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <main className="flex-1 overflow-y-auto px-6 pb-4">
            <div className="rounded-2xl border border-[#dbe2ff] bg-white px-4 py-6 shadow-sm">
              {messages.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  لا توجد رسائل في هذه المحادثة بعد.
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "max-w-[85%] whitespace-pre-line rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                        msg.role === "user"
                          ? "ms-auto bg-[#1f2a44] text-white"
                          : "me-auto border bg-white text-[#1f2a44]"
                      )}
                    >
                      <p>{msg.content}</p>
                      <span className="mt-2 block text-xs opacity-80">
                        {formatRelative(msg.timestamp)}
                      </span>
                    </div>
                  ))}
                  {loadingMessage && (
                    <div className="me-auto flex max-w-[70%] items-center gap-2 rounded-3xl border bg-white px-4 py-3 text-sm text-muted-foreground shadow-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      ينتظر EduBot المصادر المناسبة...
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </main>

          <footer className="border-t bg-white px-6 py-4">
            <div className="flex flex-col gap-3">
              <Textarea
                dir="rtl"
                rows={3}
                placeholder="اكتب سؤالك هنا..."
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                disabled={loadingMessage || isGuestLimitReached}
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
                {isGuest ? (
                  <span>
                    عدد الأسئلة المتبقية: {Math.max(FREE_GUEST_LIMIT - guestUsage, 0)} من {FREE_GUEST_LIMIT}
                  </span>
                ) : (
                  <span>جاهز للإجابة على استفساراتك الدراسية.</span>
                )}
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline">اضغط Ctrl+Enter للإرسال السريع</span>
                  <Button
                    onClick={sendQuestion}
                    disabled={!question.trim() || loadingMessage || isGuestLimitReached}
                    className="min-w-[100px]"
                  >
                    {loadingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : "إرسال"}
                  </Button>
                </div>
              </div>
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
}
