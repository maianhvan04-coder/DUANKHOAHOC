"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import {
  Loader2,
  X,
} from "lucide-react";
import { aiApi, type AiChatHistoryItem, type AiRole } from "@/app/api/ai.api";
import { useAuth } from "@/hooks/auth/useAuth";

type ChatMessage = AiChatHistoryItem & {
  id: string;
};

type AiChatWidgetProps = {
  role: AiRole;
};

type WidgetPosition = {
  x: number;
  y: number;
};

type DragState = {
  pointerId: number;
  offsetX: number;
  offsetY: number;
  moved: boolean;
};

const configByRole: Record<
  AiRole,
  {
    title: string;
    subtitle: string;
    placeholder: string;
    greeting: string;
    suggestions: string[];
  }
> = {
  public: {
    title: "AI tư vấn khóa học",
    subtitle: "Lộ trình học cá nhân hóa",
    placeholder: "Hỏi về khóa học, lộ trình, học phí...",
    greeting:
      "Mình có thể tư vấn khóa học và lộ trình học dựa trên các chương trình hiện có của trung tâm.",
    suggestions: [
      "Em mất gốc tiếng Anh nên học khóa nào?",
      "Gợi ý lộ trình TOEIC trong 4 tháng",
      "Khóa nào phù hợp cho người mới bắt đầu?",
    ],
  },
  student: {
    title: "AI cố vấn học tập",
    subtitle: "Lịch học, thông báo, tiến độ",
    placeholder: "Hỏi lịch học, thông báo, khóa học của bạn...",
    greeting:
      "Mình có thể tra cứu lịch học, thông báo, khóa học và tình hình học tập của bạn.",
    suggestions: [
      "Hôm nay em có lịch học không?",
      "Có thông báo mới không?",
      "Tóm tắt các khóa học của em",
    ],
  },
  teacher: {
    title: "AI trợ lý giáo viên",
    subtitle: "Lớp học, lịch dạy, học viên",
    placeholder: "Hỏi về lớp, lịch dạy hoặc thông báo của bạn...",
    greeting:
      "Mình có thể hỗ trợ tra cứu lớp học, lịch dạy, học viên và thông báo trong khu vực giáo viên.",
    suggestions: [
      "Tóm tắt các lớp tôi đang phụ trách",
      "Lịch dạy hôm nay của tôi có gì?",
      "Có thông báo mới nào không?",
    ],
  },
  admin: {
    title: "AI Admin Copilot",
    subtitle: "Tổng quan, phân tích, soạn nội dung",
    placeholder: "Hỏi về lớp, khóa học, học viên, thông báo...",
    greeting:
      "Mình có thể tổng hợp tình hình trung tâm, phân tích lớp học và hỗ trợ soạn nội dung quản trị.",
    suggestions: [
      "Tóm tắt tình hình hôm nay",
      "Khóa học nào đang nổi bật?",
      "Soạn thông báo nhắc lịch học",
    ],
  },
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null) {
    const maybe = error as {
      response?: { data?: { message?: unknown } };
      message?: unknown;
    };

    if (typeof maybe.response?.data?.message === "string") {
      return maybe.response.data.message;
    }

    if (typeof maybe.message === "string") {
      return maybe.message;
    }
  }

  return "AI chưa phản hồi được. Bạn thử lại sau.";
}

function getDisplayName(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split("@")[0]?.trim() || "";
  if (!source) return "";
  return source;
}

function getGreeting(role: AiRole, name?: string | null, email?: string | null) {
  const firstName = getDisplayName(name, email);
  const hello = firstName ? `Chào ${firstName},` : "Chào bạn,";

  if (role === "student") {
    return `${hello} mình có thể giúp gì cho bạn? Bạn có thể hỏi mình về lịch học, thông báo, khóa học hoặc tiến độ học tập.`;
  }

  if (role === "teacher") {
    return `${hello} mình có thể giúp gì cho bạn? Bạn có thể hỏi mình về lớp học, lịch dạy, học viên hoặc thông báo của bạn.`;
  }

  if (role === "admin") {
    return `${hello} mình có thể giúp gì cho bạn? Bạn có thể hỏi mình về khóa học, lớp học, học viên, thông báo hoặc tình hình vận hành trung tâm.`;
  }

  return `${hello} mình có thể giúp gì cho bạn? Bạn có thể hỏi mình về khóa học, lộ trình học, học phí hoặc chương trình phù hợp.`;
}

function createMessage(role: "user" | "assistant", content: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
  };
}

function AiMascot({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      className={className}
      role="img"
      aria-label="AI Everest"
    >
      <path
        d="M20 40c0-13 11-24 26-24h10c15 0 27 12 27 27v17c0 12-8 22-20 24l-4 10c-.9 2.1-3.9 1.9-4.5-.3L52 85H42c-13 0-22-9-22-22V40Z"
        fill="#55C4AE"
      />
      <path d="M9 26 48 4l39 22-39 23L9 26Z" fill="#030712" />
      <path
        d="M17 30v24"
        stroke="#030712"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="37" cy="46" r="10.5" fill="#fff" />
      <circle cx="57" cy="46" r="10.5" fill="#fff" />
      <circle cx="37" cy="46" r="5.4" fill="#030712" />
      <circle cx="57" cy="46" r="5.4" fill="#030712" />
      <rect x="31" y="64" width="8.5" height="6" rx="3" fill="#8FE2D0" />
      <rect x="44" y="64" width="8.5" height="6" rx="3" fill="#8FE2D0" />
      <rect x="57" y="64" width="8.5" height="6" rx="3" fill="#8FE2D0" />
    </svg>
  );
}

function SendArrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 24" className={className} aria-hidden="true">
      <path d="M2 2 28 12 2 22v-8l16-2-16-2V2Z" fill="currentColor" />
    </svg>
  );
}

function getWidgetSize(open: boolean) {
  if (typeof window === "undefined") {
    return open ? { width: 390, height: 640 } : { width: 80, height: 80 };
  }

  if (!open) {
    return { width: 80, height: 80 };
  }

  return {
    width: Math.min(390, window.innerWidth - 32),
    height: Math.min(640, window.innerHeight - 40),
  };
}

function clampPosition(position: WidgetPosition): WidgetPosition {
  if (typeof window === "undefined") return position;

  const margin = 16;
  const size = getWidgetSize(false);

  return {
    x: Math.min(
      Math.max(position.x, margin),
      Math.max(margin, window.innerWidth - size.width - margin)
    ),
    y: Math.min(
      Math.max(position.y, margin),
      Math.max(margin, window.innerHeight - size.height - margin)
    ),
  };
}

function getPanelPosition(iconPosition: WidgetPosition): WidgetPosition {
  if (typeof window === "undefined") return iconPosition;

  const margin = 16;
  const iconSize = getWidgetSize(false);
  const panelSize = getWidgetSize(true);
  const iconCenterX = iconPosition.x + iconSize.width / 2;
  const preferredX = iconCenterX - panelSize.width / 2;
  const preferredY = iconPosition.y - panelSize.height - 12;
  const fallbackY = iconPosition.y + iconSize.height + 12;
  const hasRoomAbove = preferredY >= margin;

  return {
    x: Math.min(
      Math.max(preferredX, margin),
      Math.max(margin, window.innerWidth - panelSize.width - margin)
    ),
    y: Math.min(
      Math.max(hasRoomAbove ? preferredY : fallbackY, margin),
      Math.max(margin, window.innerHeight - panelSize.height - margin)
    ),
  };
}

export default function AiChatWidget({ role }: AiChatWidgetProps) {
  const config = configByRole[role];
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    createMessage("assistant", getGreeting(role, user?.name, user?.email)),
  ]);
  const [suggestions, setSuggestions] = useState(config.suggestions);
  const [position, setPosition] = useState<WidgetPosition | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const dragRef = useRef<DragState | null>(null);

  const history = useMemo<AiChatHistoryItem[]>(() => {
    return messages
      .filter((item) => item.content.trim())
      .slice(-8)
      .map((item) => ({
        role: item.role,
        content: item.content,
      }));
  }, [messages]);

  useEffect(() => {
    if (position) return;

    const size = getWidgetSize(false);
    setPosition(
      clampPosition({
        x: window.innerWidth - size.width - 20,
        y: window.innerHeight - size.height - 20,
      })
    );
  }, [position]);

  useEffect(() => {
    setMessages((current) => {
      if (current.length !== 1 || current[0].role !== "assistant") {
        return current;
      }

      return [
        {
          ...current[0],
          content: getGreeting(role, user?.name, user?.email),
        },
      ];
    });
  }, [role, user?.email, user?.name]);

  useEffect(() => {
    function handleResize() {
      setPosition((current) =>
        current ? clampPosition(current) : current
      );
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  async function sendMessage(text: string) {
    const message = text.trim();
    if (!message || loading) return;

    const userMessage = createMessage("user", message);
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await aiApi.ask(role, {
        message,
        history,
      });

      setMessages((current) => [
        ...current,
        createMessage("assistant", response.data.answer),
      ]);

      if (response.data.suggestions?.length) {
        setSuggestions(response.data.suggestions);
      }
    } catch (error) {
      setMessages((current) => [
        ...current,
        createMessage("assistant", getErrorMessage(error)),
      ]);
    } finally {
      setLoading(false);
      window.setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;

    event.preventDefault();
    void sendMessage(input);
  }

  function handleDragStart(event: PointerEvent<HTMLElement>) {
    if (!position) return;

    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - position.x,
      offsetY: event.clientY - position.y,
      moved: false,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleDragMove(event: PointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const nextPosition = {
      x: event.clientX - drag.offsetX,
      y: event.clientY - drag.offsetY,
    };

    const distanceX = Math.abs(nextPosition.x - (position?.x ?? nextPosition.x));
    const distanceY = Math.abs(nextPosition.y - (position?.y ?? nextPosition.y));

    if (distanceX > 3 || distanceY > 3) {
      drag.moved = true;
    }

    setPosition(clampPosition(nextPosition));
  }

  function handleDragEnd(event: PointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already be released by the browser.
    }

    window.setTimeout(() => {
      dragRef.current = null;
    }, 0);
  }

  function handleOpenClick() {
    if (dragRef.current?.moved) return;

    setOpen(true);
  }

  return (
    <div
      className="fixed z-[70]"
      style={
        position
          ? (() => {
              const renderPosition = open ? getPanelPosition(position) : position;
              return {
                left: renderPosition.x,
                top: renderPosition.y,
              };
            })()
          : {
              right: 20,
              bottom: 20,
            }
      }
    >
      {open ? (
        <section className="flex h-[min(640px,calc(100vh-40px))] w-[min(390px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-slate-950">
          <header className="flex items-center justify-between bg-[#0D56A6] px-4 py-3 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white">
                <AiMascot className="h-11 w-11" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold">{config.title}</h2>
                <p className="truncate text-xs font-medium text-white/75">
                  {config.subtitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Đóng AI"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4 dark:bg-slate-900">
            {messages.map((message) => {
              const assistant = message.role === "assistant";

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2",
                    assistant ? "justify-start" : "justify-end"
                  )}
                >
                  {assistant ? (
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center">
                      <AiMascot className="h-10 w-10" />
                    </div>
                  ) : null}

                  <div
                    className={cn(
                      "max-w-[82%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-6",
                      assistant
                        ? "border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200"
                        : "bg-[#0D56A6] text-white"
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              );
            })}

            {loading ? (
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang xử lý...
              </div>
            ) : null}
          </div>

          <div className="border-t border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {suggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => void sendMessage(item)}
                  className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-[#0D56A6] hover:text-[#0D56A6] dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                >
                  {item}
                </button>
              ))}
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex min-h-[58px] items-center gap-2 rounded-[22px] border-2 border-[#0D56A6] bg-white px-3.5 py-1.5 shadow-[inset_0_0_0_2px_rgba(13,86,166,0.14)] transition focus-within:ring-2 focus-within:ring-[#0D56A6]/20 dark:bg-slate-900"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleInputKeyDown}
                rows={1}
                maxLength={1200}
                placeholder="Viết một tin nhắn"
                className="max-h-24 min-h-8 flex-1 resize-none border-0 bg-transparent px-0 py-1.5 text-base leading-6 text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
              />

              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-[#0D56A6] disabled:cursor-not-allowed disabled:opacity-45 dark:hover:bg-white/10"
                aria-label="Gửi câu hỏi"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SendArrow className="h-6 w-7" />
                )}
              </button>
            </form>
          </div>
        </section>
      ) : (
        <button
          type="button"
          onClick={handleOpenClick}
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
          className="flex h-20 w-20 cursor-grab touch-none items-center justify-center rounded-full bg-transparent drop-shadow-[0_12px_18px_rgba(15,23,42,0.22)] transition hover:scale-105 active:cursor-grabbing"
          aria-label={config.title}
        >
          <AiMascot className="h-20 w-20" />
        </button>
      )}
    </div>
  );
}
