import express from "express";
import { clerkClient, getAuth } from "@clerk/express";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";

const router = express.Router();

const FLASK_API_BASE = process.env.FLASK_API_BASE || "http://localhost:8000";
const GUEST_LIMIT = Number(process.env.EDUBOT_GUEST_LIMIT || 5);
const GUEST_USAGE_COOKIE = "edubot_guest_usage";
const GUEST_ID_COOKIE = "edubot_guest_id";

// -----------------------------------------------------------------------------
// Cookie helpers
// -----------------------------------------------------------------------------
const parseCookies = (header = "") =>
  header.split(";").reduce((acc, chunk) => {
    if (!chunk) return acc;
    const [key, ...rest] = chunk.trim().split("=");
    if (!key) return acc;
    acc[key] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});

const appendCookie = (res, name, value, options = {}) => {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.secure) parts.push("Secure");
  parts.push(`Path=${options.path || "/"}`);
  res.append("Set-Cookie", parts.join("; "));
};

const ensureGuestId = (req, res) => {
  const cookies = parseCookies(req.headers.cookie || "");
  let guestId = cookies[GUEST_ID_COOKIE];
  if (!guestId) {
    guestId = randomUUID();
    appendCookie(res, GUEST_ID_COOKIE, guestId, {
      maxAge: 3600 * 24 * 365,
      sameSite: "Lax",
    });
  }
  return guestId;
};

const getGuestUsage = (req) => {
  const cookies = parseCookies(req.headers.cookie || "");
  const value = Number(cookies[GUEST_USAGE_COOKIE] || 0);
  return Number.isFinite(value) && value >= 0 ? value : 0;
};

const setGuestUsage = (res, value) => {
  appendCookie(res, GUEST_USAGE_COOKIE, String(value), {
    maxAge: 3600 * 24,
    sameSite: "Lax",
  });
};

// -----------------------------------------------------------------------------
// Helper to forward requests to Flask API
// -----------------------------------------------------------------------------
const forwardFlask = async (path, { method = "GET", headers = {}, body } = {}) => {
  const response = await fetch(`${FLASK_API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.status === "error") {
    const error = new Error(payload.message || payload.error || response.statusText);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
};

const normalizeGrade = (grade) => {
  if (!grade) return "5";
  const str = String(grade).trim().toLowerCase();
  if (str.startsWith("g")) return str.slice(1) || "5";
  if (/^[1-6]$/.test(str)) return str;
  return "5";
};

const resolveStudentMeta = async (req, res) => {
  const auth = getAuth(req);
  const userId = auth.userId;

  if (!userId) {
    const guestId = ensureGuestId(req, res);
    return {
      isGuest: true,
      flaskUserId: `guest-${guestId}`,
      studentMeta: {
        grade: "5",
        term: "1",
        name: `Guest-${guestId.slice(0, 8)}`,
        age: "11",
      },
    };
  }

  const user = await clerkClient.users.getUser(userId);
  const profile = user.privateMetadata?.profile || {};

  if (!profile.grade) {
    const error = new Error("الرجاء إكمال الملف الشخصي وتحديد الصف الدراسي.");
    error.status = 400;
    throw error;
  }

  const grade = normalizeGrade(profile.grade);
  const term = profile.term ? String(profile.term) : "1";
  const name =
    user.firstName?.trim() ||
    user.fullName?.trim() ||
    user.username?.trim() ||
    `طالب-${userId.slice(0, 6)}`;
  const age = profile.birthYear
    ? String(Math.max(6, new Date().getFullYear() - Number(profile.birthYear)))
    : "11";

  return {
    isGuest: false,
    flaskUserId: userId,
    studentMeta: {
      grade,
      term,
      name,
      age,
    },
  };
};

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------
router.get("/history", async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      return res.json({ status: "ok", chats: [] });
    }
    const result = await forwardFlask("/api/chats", {
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": auth.userId,
      },
    });
    res.json(result);
  } catch (error) {
    console.error("Failed to load history", error);
    res.status(error.status || 500).json({ status: "error", message: error.message });
  }
});

router.post("/chat/new", async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      return res.status(401).json({ status: "error", message: "تسجيل الدخول مطلوب." });
    }
    const { studentMeta } = await resolveStudentMeta(req, res);
   const payload = {
     title: (req.body?.title || "").trim(),
     student_meta: studentMeta,
   };
    const result = await forwardFlask("/api/chat/new", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": auth.userId,
      },
      body: payload,
    });
    res.json(result);
  } catch (error) {
    console.error("Failed to create chat", error);
    res.status(error.status || 500).json({ status: "error", message: error.message });
  }
});

router.get("/chat/:chatId", async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      return res.status(401).json({ status: "error", message: "تسجيل الدخول مطلوب." });
    }
    const result = await forwardFlask(`/api/chat/${req.params.chatId}`, {
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": auth.userId,
      },
    });
    res.json(result);
  } catch (error) {
    console.error("Failed to fetch chat", error);
    res.status(error.status || 500).json({ status: "error", message: error.message });
  }
});

router.delete("/chat/:chatId", async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      return res.status(401).json({ status: "error", message: "تسجيل الدخول مطلوب." });
    }
    const result = await forwardFlask(`/api/chat/${req.params.chatId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": auth.userId,
      },
    });
    res.json(result);
  } catch (error) {
    console.error("Failed to delete chat", error);
    res.status(error.status || 500).json({ status: "error", message: error.message });
  }
});

router.post("/chat/:chatId/ask", async (req, res) => {
  try {
    const question = (req.body?.question || "").trim();
    if (!question) {
      return res.status(400).json({ status: "error", message: "يرجى كتابة سؤال قصير حتى مع وجود صورة." });
    }
    const context = await resolveStudentMeta(req, res);
    if (context.isGuest) {
      return res.status(401).json({ status: "error", message: "تسجيل الدخول مطلوب للمحادثات." });
    }
    const payload = {
      question,
      student_meta: context.studentMeta,
      image_base64: (req.body?.image_base64 || "").trim() || undefined,
      mode_flag: Number(req.body?.mode_flag || 0),
    };
    const result = await forwardFlask(`/api/chat/${req.params.chatId}/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": context.flaskUserId,
      },
      body: payload,
    });
    res.json(result);
  } catch (error) {
    console.error("Failed to send chat question", error);
    res.status(error.status || 500).json({ status: "error", message: error.message });
  }
});

router.post("/ask", async (req, res) => {
  try {
    const question = (req.body?.question || "").trim();
    if (!question) {
      return res.status(400).json({ status: "error", message: "يرجى كتابة سؤال قصير حتى مع وجود صورة." });
    }

    const context = await resolveStudentMeta(req, res);
    if (context.isGuest) {
      const usage = getGuestUsage(req);
      if (usage >= GUEST_LIMIT) {
        return res.json({ status: "error", message: "لقد استخدمت جميع الأسئلة المجانية." });
      }
    }

    const payload = {
      question,
      student_meta: context.studentMeta,
      image_base64: (req.body?.image_base64 || "").trim() || undefined,
      mode_flag: Number(req.body?.mode_flag || 0),
    };
    const result = await forwardFlask("/api/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": context.flaskUserId,
      },
      body: payload,
    });

    if (context.isGuest) {
      const usage = getGuestUsage(req) + 1;
      setGuestUsage(res, usage);
    }

    res.json(result);
  } catch (error) {
    console.error("Failed to send quick question", error);
    res.status(error.status || 500).json({ status: "error", message: error.message });
  }
});

router.post("/voice-question", async (req, res) => {
  try {
    const transcript = (req.body?.transcript || "").trim();
    if (!transcript) {
      return res.status(400).json({ status: "error", message: "transcript_required" });
    }

    const context = await resolveStudentMeta(req, res);
    if (context.isGuest) {
      const usage = getGuestUsage(req);
      if (usage >= GUEST_LIMIT) {
        return res.json({ status: "error", message: "لقد استخدمت جميع الأسئلة المجانية." });
      }
    }

    const payload = {
      transcript,
      student_meta: context.studentMeta,
      context: req.body?.context,
      language: req.body?.language,
      mode_flag: Number(req.body?.mode_flag || 0),
    };

    const result = await forwardFlask("/api/voice_question", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": context.flaskUserId,
      },
      body: payload,
    });

    if (context.isGuest) {
      const usage = getGuestUsage(req) + 1;
      setGuestUsage(res, usage);
    }

    res.json(result);
  } catch (error) {
    console.error("Failed to process voice question", error);
    res
      .status(error.status || 500)
      .json({ status: "error", message: error.message, fallback: true });
  }
});

router.post("/tts", async (req, res) => {
  try {
    const stream = req.query.stream !== "0";
    const response = await fetch(`${FLASK_API_BASE}/api/tts${stream ? "?stream=1" : ""}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body || {}),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw Object.assign(new Error(payload.message || response.statusText), {
        status: response.status,
        payload,
      });
    }

    if (stream && response.body) {
      res.setHeader("Content-Type", response.headers.get("content-type") || "audio/mpeg");
      res.setHeader("Cache-Control", "no-store");
      Readable.fromWeb(response.body).pipe(res);
      return;
    }

    const payload = await response.json();
    res.json(payload);
  } catch (error) {
    console.error("Failed to generate TTS", error);
    res
      .status(error.status || 500)
      .json({ status: "error", message: error.message, payload: error.payload });
  }
});

router.post("/live/session", async (req, res) => {
  try {
    const context = await resolveStudentMeta(req, res);
    const payload = {
      metadata: {
        student: context.studentMeta,
        client: req.body?.client || {},
      },
    };
    const result = await forwardFlask("/api/live", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": context.flaskUserId,
      },
      body: payload,
    });
    res.json(result);
  } catch (error) {
    console.error("Failed to create Vapi session", error);
    res
      .status(error.status || 500)
      .json({ status: "error", message: error.message, fallback: true });
  }
});

export default router;
