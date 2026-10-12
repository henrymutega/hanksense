import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";
import { Bot, MessageCircle, RotateCcw, Send, X } from "lucide-react";
import { askSiteAssistant } from "@/lib/site-assistant.functions";

type Msg = { role: "user" | "assistant"; content: string };

const TXT = {
  en: {
    title: "Hanksense Assistant",
    online: "Online · ask me anything",
    hello: "Hi! I'm Hanks 👋 Ask me about the AI CV Coach, the recruitment platform for universities, pricing or how to sign up.",
    placeholder: "Type your question…",
    tip: "Need help? Chat with us",
    chips: [
      "How does the AI CV Coach work?",
      "How do universities use the ATS?",
      "What does it cost?",
      "How do I sign up?",
    ],
  },
  zh: {
    title: "Hanksense 助手",
    online: "在线 · 随时提问",
    hello: "你好！我是 Hanks 👋 可以问我 AI 简历教练、高校招聘平台、收费或注册方式。",
    placeholder: "输入你的问题…",
    tip: "需要帮助？和我们聊聊",
    chips: ["AI 简历教练如何使用？", "高校如何使用招聘系统？", "收费标准是什么？", "如何注册？"],
  },
};

export function SiteChatbot() {
  const { i18n } = useTranslation();
  const L = i18n.language?.startsWith("zh") ? TXT.zh : TXT.en;
  const ask = useServerFn(askSiteAssistant);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);
  useEffect(() => {
    if (open && !busy) inputRef.current?.focus();
  }, [open, busy]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next = [...msgs, { role: "user" as const, content: q }];
    setMsgs(next);
    setInput("");
    setErr(null);
    setBusy(true);
    try {
      const r = await ask({ data: { messages: next.slice(-20) } });
      if ("text" in r && r.text) setMsgs([...next, { role: "assistant", content: r.text }]);
      else setErr(("error" in r && r.error) || "Something went wrong.");
    } catch {
      setErr("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[min(560px,calc(100vh-7rem))] w-[calc(100vw-2rem)] sm:w-[380px] flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3 border-b border-border bg-primary px-4 py-3 text-primary-foreground">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary-foreground/15">
              <Bot className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">{L.title}</p>
              <p className="text-xs opacity-80">{L.online}</p>
            </div>
            <button aria-label="Reset" onClick={() => { setMsgs([]); setErr(null); }} className="rounded p-1.5 hover:bg-primary-foreground/15">
              <RotateCcw className="h-4 w-4" />
            </button>
            <button aria-label="Close chat" onClick={() => setOpen(false)} className="rounded p-1.5 hover:bg-primary-foreground/15">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm">
            <div className="rounded-2xl rounded-tl-sm bg-muted px-3 py-2">{L.hello}</div>
            {msgs.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {L.chips.map((c) => (
                  <button key={c} onClick={() => send(c)} className="rounded-full border border-primary/40 px-3 py-1 text-xs text-primary hover:bg-primary/10">
                    {c}
                  </button>
                ))}
              </div>
            )}
            {msgs.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="ml-auto max-w-[85%] w-fit rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-primary-foreground">
                  {m.content}
                </div>
              ) : (
                <div key={i} className="prose prose-sm max-w-none dark:prose-invert text-foreground [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ),
            )}
            {busy && (
              <div className="flex gap-1 px-1 py-2">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            )}
            {err && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</div>}
            <div ref={endRef} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-end gap-2 border-t border-border p-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              rows={1}
              placeholder={L.placeholder}
              className="max-h-28 flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button type="submit" disabled={busy || !input.trim()} aria-label="Send" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      <div className="flex items-center gap-2">
        {!open && (
          <span className="hidden sm:block rounded-full border border-border bg-card px-3 py-1.5 text-xs shadow-md">{L.tip}</span>
        )}
        <button
          aria-label={open ? "Close chat" : "Open chat"}
          onClick={() => setOpen((o) => !o)}
          className="relative grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-105"
        >
          {!open && <span className="absolute inset-0 animate-ping rounded-full bg-primary/40" />}
          {open ? <X className="h-6 w-6" /> : <MessageCircle className="relative h-6 w-6" />}
        </button>
      </div>
    </div>
  );
}
