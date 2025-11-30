import express from "express";
import { clerkClient } from "@clerk/express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    message: "We are Happy to see you 😊",
    userId: req.auth.userId,
  });
});

router.post("/metadata", async (req, res) => {
  try {
    const { birthday, grade, role } = req.body || {};
    if (!birthday || typeof grade === "undefined" || !role) {
      return res.status(400).json({ error: "Missing birthday, grade, or role" });
    }

    const userId = req.auth.userId;
    const user = await clerkClient.users.getUser(userId);
    const currentMetadata = user.privateMetadata || {};

    await clerkClient.users.updateUser(userId, {
      privateMetadata: {
        ...currentMetadata,
        birthday,
        grade,
        role,
      },
    });

    res.json({ status: "ok" });
  } catch (error) {
    console.error("Failed to update private metadata", error);
    res.status(500).json({ error: "Unable to save metadata" });
  }
});

export default router;
