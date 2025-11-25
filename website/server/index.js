import "dotenv/config";
import express from "express";
import cors from "cors";
import {
  clerkMiddleware,
  requireAuth,
  clerkClient,
  getAuth,
} from "@clerk/express";
import ragRouter from "./routes/rag.js";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN?.split(",") ?? [
  "http://localhost:5173",
];

if (!process.env.CLERK_SECRET_KEY) {
  throw new Error("Missing CLERK_SECRET_KEY in server/.env");
}

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(clerkMiddleware());
app.use("/api/rag", ragRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/api/protected", requireAuth(), (req, res) => {
  res.json({
    message: "Protected route ✅ You are authorized",
    userId: req.auth.userId,
  });
});

app.get("/api/profile", requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).end();
    }

    const user = await clerkClient.users.getUser(userId);
    const profile = user.privateMetadata?.profile ?? null;
    res.json({ profile });
  } catch (error) {
    console.error("Failed to fetch profile metadata", error);
    res.status(500).json({ profile: null, error: "Unable to load profile" });
  }
});

app.post("/api/profile", requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).end();
    }

    const { birthday, grade, role } = req.body || {};

    const rawBirthday = String(birthday ?? "").trim();
    const birthdayMatch = rawBirthday.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!birthdayMatch) {
      return res.status(400).json({ error: "birthday" });
    }
    const [, day, month, yearStr] = birthdayMatch;
    const birthYear = Number(yearStr);
    const monthNum = Number(month);
    const dayNum = Number(day);
    const currentYear = new Date().getFullYear();
    if (
      birthYear < 1900 ||
      birthYear > currentYear ||
      monthNum < 1 ||
      monthNum > 12 ||
      dayNum < 1 ||
      dayNum > 31
    ) {
      return res.status(400).json({ error: "birthday" });
    }
    const isoBirthday = new Date(`${yearStr}-${month}-${day}`);
    if (Number.isNaN(isoBirthday.getTime())) {
      return res.status(400).json({ error: "birthday" });
    }

    let normalizedGrade = String(grade ?? "").trim().toLowerCase();
    if (/^[1-6]$/.test(normalizedGrade)) {
      normalizedGrade = `g${normalizedGrade}`;
    }
    if (!/^g[1-6]$/.test(normalizedGrade)) {
      return res.status(400).json({ error: "grade" });
    }

    const normalizedRole = String(role ?? "").trim().toLowerCase();
    if (!["student", "parent", "teacher"].includes(normalizedRole)) {
      return res.status(400).json({ error: "role" });
    }

    const updated = await clerkClient.users.updateUserMetadata(userId, {
      privateMetadata: {
        profile: {
          birthday: `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${yearStr}`,
          birthYear,
          grade: normalizedGrade,
          role: normalizedRole,
        },
      },
    });

    const profile = updated.privateMetadata?.profile ?? null;
    res.json({ ok: true, profile });
  } catch (error) {
    console.error("Failed to update profile metadata", error);
    res.status(500).json({ ok: false, error: "Unable to save profile" });
  }
});

app.delete("/api/profile/delete", requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    await clerkClient.users.deleteUser(userId);
    res.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete user account", error);
    const message =
      error?.errors?.[0]?.longMessage ||
      error?.message ||
      "Unable to delete account";
    res.status(500).json({ ok: false, error: message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API listening on http://localhost:${PORT}`);
});
