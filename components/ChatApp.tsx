"use client";

import { useState } from "react";
import LoginForm from "./LoginForm";
import Messenger from "./Messenger";
import type { Credentials } from "@/lib/greenApi";
import { loadJson, saveJson } from "@/lib/storage";

const CREDS_KEY = "greenApiCredentials";

// Rendered client-only (see ClientRoot) so localStorage can be read during the first render.
export default function ChatApp() {
  const [creds, setCreds] = useState<Credentials | null>(() => loadJson<Credentials | null>(CREDS_KEY, null));

  function login(next: Credentials) {
    saveJson(CREDS_KEY, next);
    setCreds(next);
  }

  function logout() {
    saveJson(CREDS_KEY, null);
    setCreds(null);
  }

  return creds ? <Messenger creds={creds} onLogout={logout} /> : <LoginForm onLogin={login} />;
}
