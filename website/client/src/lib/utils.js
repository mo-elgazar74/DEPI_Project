// src/lib/utils.js

export const AI_API_URL = import.meta.env.VITE_AI_URL;
export const NODE_SERVER_URL = import.meta.env.VITE_SERVER_URL;

// مثال على request للـ AI
export async function askAI(question) {
  const res = await fetch(`${AI_API_URL}/api/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  return res.json();
}

// request للـ Node server
export async function getServerData(endpoint) {
  const res = await fetch(`${NODE_SERVER_URL}/${endpoint}`);
  return res.json();
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}