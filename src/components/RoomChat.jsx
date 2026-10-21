import React, { useCallback, useEffect, useRef, useState } from "react";
import "boxicons/css/boxicons.min.css";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import { chatApi, getToken } from "../services/api";
import { subscribeChat } from "../services/realtime";

const formatTime = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

// Gabungkan pesan baru tanpa duplikat (POST response & echo socket bisa
// datang bersamaan), lalu urutkan berdasarkan waktu/kronologi.
const mergeMessage = (list, incoming) => {
  if (!incoming) return list;
  const merged = list.filter((m) => String(m.id) !== String(incoming.id));
  merged.push(incoming);
  return merged.sort((a, b) => {
    const ta = new Date(a.createdAt ?? 0).getTime();
    const tb = new Date(b.createdAt ?? 0).getTime();
    if (ta !== tb) return ta - tb;
    return String(a.id).localeCompare(String(b.id));
  });
};

const RoomChat = () => {
  const [open, setOpen] = useState(false);
  const [pesan, setPesan] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [typing, setTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const { t } = useSettings();
  const { user, isAuthenticated } = useAuth();

  const scrollRef = useRef(null);
  const tempIdRef = useRef(0);
  const isCustomer = isAuthenticated && user?.role === "pelanggan";

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await chatApi.listMessages();
      setMessages(data?.messages ?? []);
    } catch (err) {
      setError(err?.status === 401 ? t("chat.error") : t("chat.error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Muat percakapan saat chat dibuka / status login berubah.
  useEffect(() => {
    if (open) loadMessages();
  }, [open, isCustomer, loadMessages]);

  // Realtime: pesan & indikator mengetik dari bot (hanya pelanggan login).
  useEffect(() => {
    if (!open || !isCustomer) return undefined;

    const token = getToken();
    const unsubscribe = subscribeChat(user?.id, token, (payload) => {
      if (payload.typing !== undefined) {
        setTyping(Boolean(payload.typing));
        return;
      }
      if (payload.sender && payload.id) {
        setMessages((prev) => mergeMessage(prev, payload));
        setTyping(false);
      }
    });

    return unsubscribe;
  }, [open, isCustomer, user?.id]);

  // Auto-scroll setiap ada pesan/typing baru.
  useEffect(() => {
    scrollToBottom();
  }, [messages, typing, scrollToBottom]);

  const kirim = async () => {
    const teks = pesan.trim();
    if (!teks || sending) return;

    const tempId = `tmp-${(tempIdRef.current += 1)}`;
    const optimistic = {
      id: tempId,
      sender: "user",
      content: teks,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);
    setPesan("");
    setSending(true);
    setTyping(true);

    try {
      await chatApi.setTyping(true).catch(() => {});
      const data = await chatApi.sendMessage(teks);
      const { userMessage, botMessage, persisted } = data ?? {};
      setMessages((prev) => {
        let next = prev;
        // Tamu: pertahankan bubble optimistis (tidak ada userMessage persisted).
        if (persisted && userMessage && userMessage.id !== tempId) {
          next = next.filter((m) => m.id !== tempId);
        }
        for (const message of [userMessage, botMessage].filter(Boolean)) {
          next = mergeMessage(next, message);
        }
        return next;
      });
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setError(err?.status === 401 ? t("chat.error") : t("chat.sendError"));
      setPesan(teks);
    } finally {
      setTyping(false);
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      kirim();
    }
  };

  return (
    <>
      {/* ===== Overlay Blur ===== */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] transition-all duration-300"
        ></div>
      )}

      {/* ===== Container Chat & Gagang ===== */}
      <div className="fixed inset-y-0 right-0 flex items-center z-[100]">
        {/* ===== Box Chat ===== */}
        <div
          className={`relative h-[100dvh] bg-white shadow-2xl flex flex-col overflow-hidden font-antonio transition-all duration-300 ${
            open
              ? "w-[20rem] sm:w-[20rem] md:w-[23rem] lg:w-[25rem] xl:w-[27rem]"
              : "w-0"
          }`}
        >
          {/* ===== Header Chat ===== */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#f49827] text-white">
            <div className="flex items-center gap-3">
              <i className="bx bxs-bot text-3xl bg-white text-[#f49827] p-1 rounded-full"></i>
              <div>
                <h3 className="font-semibold text-lg">{t("chat.botName")}</h3>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
                  </span>
                  <p className="text-sm text-gray-100">
                    {typing ? t("chat.typing") : t("chat.online")}
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("chat.close")}
              className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-white/20"
            >
              <i className="bx bx-x text-2xl"></i>
            </button>
          </div>

          {(
            <>
              {/* ===== Area Obrolan ===== */}
              <div
                ref={scrollRef}
                className="flex-1 bg-gray-50 px-4 py-3 overflow-y-auto"
              >
                {loading && messages.length === 0 && (
                  <p className="mt-6 text-center text-sm text-gray-400">
                    {t("chat.loading")}
                  </p>
                )}

                {!loading && messages.length === 0 && !error && (
                  <p className="mt-6 text-center text-sm text-gray-400">
                    {t("chat.empty")}
                  </p>
                )}

                {messages.map((msg) => {
                  const isBot = msg.sender === "bot";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col mb-4 ${
                        isBot ? "items-start" : "items-end"
                      }`}
                    >
                      <div
                        className={`flex items-center gap-2 mb-1 ${
                          isBot ? "text-[#f49827]" : "text-black"
                        }`}
                      >
                        {isBot ? (
                          <>
                            <i className="bx bxs-bot text-lg"></i>
                            <span className="font-semibold text-sm">
                              {t("chat.botName")}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="font-semibold text-sm">
                              {t("chat.you")}
                            </span>
                            <i className="bx bxs-user text-lg"></i>
                          </>
                        )}
                      </div>
                      <div
                        className={`px-3 py-2 rounded-xl w-fit max-w-[80%] break-words whitespace-pre-wrap ${
                          isBot
                            ? "bg-[#f49827] text-white"
                            : "bg-black text-white"
                        } ${msg.id?.toString().startsWith("tmp-") ? "opacity-70" : ""}`}
                      >
                        {msg.content}
                      </div>
                      <p
                        className={`text-xs text-gray-500 mt-1 ${
                          isBot ? "ml-1" : "mr-1"
                        }`}
                      >
                        {t("chat.sent")} {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  );
                })}

                {typing && (
                  <div className="flex flex-col items-start mb-4">
                    <div className="flex items-center gap-2 mb-1 text-[#f49827]">
                      <i className="bx bxs-bot text-lg"></i>
                      <span className="font-semibold text-sm">
                        {t("chat.botName")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 rounded-xl bg-[#f49827] px-3 py-3">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-white [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-white [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-white" />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mb-3 flex flex-col items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600">
                    <span>{error}</span>
                    <button
                      type="button"
                      onClick={loadMessages}
                      className="rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                    >
                      {t("chat.retry")}
                    </button>
                  </div>
                )}
              </div>

              {/* ===== Input Chat ===== */}
              <div className="border-t border-gray-200 bg-white">
                {isCustomer && (
                  <p className="px-3 pt-2 text-center text-[11px] text-gray-400">
                    {t("chat.note")}
                  </p>
                )}
                <div className="flex items-center gap-2.5 p-3">
                  <div className="flex flex-1 items-center rounded-full border border-gray-300 bg-gray-100 px-4 py-2 transition-colors focus-within:border-[#f49827]">
                    <input
                      type="text"
                      value={pesan}
                      onChange={(e) => setPesan(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={t("chat.ph")}
                      maxLength={1000}
                      className="flex-1 bg-transparent text-black placeholder-gray-400 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={kirim}
                    aria-label={t("chat.ph")}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f49827] text-white transition-all duration-300 hover:bg-[#d97f0f] disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!pesan.trim() || sending}
                  >
                    <i className="bx bxs-send text-xl"></i>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ===== Gagang Pintu ===== */}
        <div
          onClick={() => setOpen(!open)}
          className={`flex fixed top-1/2 -translate-y-1/2 bg-[#f49827] text-white w-10 h-14 rounded-l-2xl shadow-lg cursor-pointer transition-all duration-300 items-center justify-center filter blur-[1px] hover:blur-0 z-[101] ${
            open
              ? "right-[20rem] sm:right-[20rem] md:right-[23rem] lg:right-[25rem] xl:right-[27rem]"
              : "right-0"
          }`}
        >
          <i className="bx bxs-chat text-2xl text-white absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"></i>
        </div>
      </div>
    </>
  );
};

export default RoomChat;
