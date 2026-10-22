"use client";

import { FormEvent, useState } from "react";
import { Credentials, getStateInstance } from "@/lib/greenApi";

const DEFAULT_API_URL = "https://api.green-api.com";

export default function LoginForm({
  onLogin,
}: {
  onLogin: (creds: Credentials) => void;
}) {
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [idInstance, setIdInstance] = useState("");
  const [apiTokenInstance, setApiTokenInstance] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const creds = {
      apiUrl: apiUrl.trim() || DEFAULT_API_URL,
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
    };
    setError(null);
    setLoading(true);
    try {
      const { stateInstance } = await getStateInstance(creds);
      console.log("stateInstance", stateInstance);
      if (stateInstance !== "authorized") {
        setError(
          `Инстанс не авторизован (состояние: ${stateInstance}). Авторизуйте его в личном кабинете GREEN-API.`,
        );
        return;
      }
      onLogin(creds);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось подключиться");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-[var(--chat-bg)] p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-[var(--panel)] p-6 shadow-lg ring-1 ring-[var(--border)]"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#4f7cff] to-[#9b5cff] text-lg font-bold text-white">
            M
          </div>
          <div>
            <h1 className="text-lg font-semibold">Вход в чат MAX</h1>
            <p className="text-sm text-[var(--muted)]">
              Данные инстанса из GREEN-API
            </p>
          </div>
        </div>

        <label className="mb-3 block">
          <span className="mb-1 block text-sm text-[var(--muted)]">
            idInstance
          </span>
          <input
            className="input"
            inputMode="numeric"
            required
            pattern="\d+"
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value)}
            placeholder="3100123456"
          />
        </label>
        <label className="mb-3 block">
          <span className="mb-1 block text-sm text-[var(--muted)]">
            apiTokenInstance
          </span>
          <input
            className="input"
            type="password"
            required
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
            placeholder="d75b3a66374942c5b3c019c698abc2067e151558acbd412345"
          />
        </label>
        <label className="mb-5 block">
          <span className="mb-1 block text-sm text-[var(--muted)]">apiUrl</span>
          <input
            className="input"
            type="url"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
          />
        </label>

        {error && (
          <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[var(--accent)] py-2.5 font-medium text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Проверка…" : "Войти"}
        </button>
      </form>
    </div>
  );
}
