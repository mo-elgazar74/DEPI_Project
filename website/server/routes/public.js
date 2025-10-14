import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Public endpoint works ✅" });
});

export default router;
