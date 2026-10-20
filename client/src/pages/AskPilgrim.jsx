"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import api from "../services/api";
import useReducedMotion from "../hooks/useReducedMotion";

// ═══════════════════════════════════════════════════════════════
//  Suggested questions
// ═══════════════════════════════════════════════════════════════

const SUGGESTED_QUESTIONS = [
  "What are the steps of Umrah?",
  "What are the rules of Ihram?",
  "How do I perform Tawaf?",
  "What duas should I recite during Hajj?",
];

// ═══════════════════════════════════════════════════════════════
//  GuidanceNote — static header, no animation
// ═══════════════════════════════════════════════════════════════

function GuidanceNote() {
  return (
    <div className="rounded-xl border border-emerald/10 bg-emerald/[0.02] px-4 py-3">
      <p className="text-xs text-ink/45 leading-relaxed">
        This AI assistant provides general guidance based on common
        scholarly traditions. For specific religious rulings (fatwa),
        please consult a qualified scholar. Answers may not reflect
        every school of thought.
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  TypingIndicator — GSAP timeline loop, ring/radial dots
// ═══════════════════════════════════════════════════════════════

function RingDot({ innerRef }) {
  return (
    <svg
      ref={innerRef}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      className="text-emerald"
      fill="none"
      aria-hidden="true"
      style={{ willChange: "transform, opacity" }}
    >
      {/* Outer ring */}
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
      {/* Inner ring */}
      <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
      {/* Center dot */}
      <circle cx="7" cy="7" r="1.8" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

function TypingIndicator() {
  const dot1Ref = useRef(null);
  const dot2Ref = useRef(null);
  const dot3Ref = useRef(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) {
      [dot1Ref, dot2Ref, dot3Ref].forEach((ref) => {
        if (ref.current) gsap.set(ref.current, { scale: 1, opacity: 0.6 });
      });
      return;
    }

    const dots = [dot1Ref.current, dot2Ref.current, dot3Ref.current].filter(Boolean);
    if (dots.length === 0) return;

    // Set initial state
    gsap.set(dots, { scale: 0.6, opacity: 0.3 });

    const tl = gsap.timeline({ repeat: -1, yoyo: true });

    dots.forEach((dot, i) => {
      tl.to(
        dot,
        {
          scale: 1.15,
          opacity: 1,
          duration: 0.25,
          ease: "power2.out",
        },
        i * 0.18
      );
    });

    // Brief hold at peak
    tl.to({}, { duration: 0.35 });

    return () => tl.kill();
  }, [prefersReduced]);

  return (
    <div className="flex items-start gap-3">
      {/* Assistant avatar — mini ring motif */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-ink/5">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          className="text-emerald"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <circle cx="8" cy="8" r="6" />
          <circle cx="8" cy="8" r="2" fill="currentColor" />
        </svg>
      </div>

      {/* Dots container */}
      <div className="rounded-2xl rounded-tl-none bg-sand px-4 py-3.5">
        <div className="flex items-center gap-2.5" aria-label="Assistant is typing">
          <RingDot innerRef={dot1Ref} />
          <RingDot innerRef={dot2Ref} />
          <RingDot innerRef={dot3Ref} />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  SuggestedChips — staggered entrance, MagneticButton-lite hover
// ═══════════════════════════════════════════════════════════════

function SuggestedChips({ onSelect, visible }) {
  const containerRef = useRef(null);
  const animatedRef = useRef(false);

  // Staggered entrance
  useEffect(() => {
    if (!visible || !containerRef.current || animatedRef.current) return;
    animatedRef.current = true;

    const chips = containerRef.current.querySelectorAll("[data-chip]");
    if (chips.length === 0) return;

    // Hide chips immediately with GSAP set, then animate in
    const ctx = gsap.context(() => {
      gsap.set(chips, { opacity: 0, y: 10 });
      gsap.to(chips, {
        opacity: 1,
        y: 0,
        duration: 0.35,
        stagger: 0.06,
        ease: "power3.out",
      });
    });

    return () => ctx.revert();
  }, [visible]);

  return (
    <div ref={containerRef} className="flex flex-wrap gap-2">
      {SUGGESTED_QUESTIONS.map((q, i) => (
        <SuggestedChip key={i} question={q} onSelect={onSelect} index={i} />
      ))}
    </div>
  );
}

function SuggestedChip({ question, onSelect }) {
  const btnRef = useRef(null);
  const ctxRef = useRef(null);
  const xToRef = useRef(null);
  const yToRef = useRef(null);

  // MagneticButton-lite hover (smaller radius, subtle)
  const handleMouseMove = useCallback((e) => {
    const btn = btnRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (dist > 150) {
      if (ctxRef.current) ctxRef.current.revert();
      xToRef.current = null;
      yToRef.current = null;
      return;
    }

    // Initialise quickTo on first hover inside radius
    if (!xToRef.current && !ctxRef.current) {
      ctxRef.current = gsap.context(() => {
        xToRef.current = gsap.quickTo(btn, "x", { duration: 0.3, ease: "power3.out" });
        yToRef.current = gsap.quickTo(btn, "y", { duration: 0.3, ease: "power3.out" });
      });
    }

    const norm = 1 - dist / 150;
    xToRef.current?.(deltaX * 0.2 * norm);
    yToRef.current?.(deltaY * 0.2 * norm);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (ctxRef.current) {
      ctxRef.current.revert();
      ctxRef.current = null;
    }
    xToRef.current = null;
    yToRef.current = null;
    gsap.to(btnRef.current, { x: 0, y: 0, duration: 0.3, ease: "power3.out" });
  }, []);

  useEffect(() => {
    return () => {
      if (ctxRef.current) ctxRef.current.revert();
    };
  }, []);

  return (
    <button
      ref={btnRef}
      data-chip
      onClick={() => onSelect(question)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="rounded-full border border-ink/12 bg-paper px-3.5 py-1.5 text-xs font-medium text-ink/60 hover:text-ink hover:border-ink/25 transition-colors duration-200"
      style={{ willChange: "transform", position: "relative" }}
    >
      {question}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ChatBubble — GSAP entrance on mount
// ═══════════════════════════════════════════════════════════════

function ChatBubble({ role, text, usedFallback }) {
  const bubbleRef = useRef(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!bubbleRef.current) return;

    const ctx = gsap.context(() => {
      if (prefersReduced) {
        gsap.set(bubbleRef.current, { opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        bubbleRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }
      );
    });

    return () => ctx.revert();
  }, [prefersReduced]);

  const isUser = role === "user";

  return (
    <div
      ref={bubbleRef}
      className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? "bg-emerald/10 text-emerald"
            : "bg-ink/5 text-ink/40"
        }`}
      >
        {isUser ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <circle cx="12" cy="12" r="2.25" />
            <circle cx="12" cy="12" r="8.25" strokeDasharray="8 35" strokeLinecap="round" />
          </svg>
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-emerald text-paper rounded-tr-none font-medium"
            : usedFallback
              ? "bg-sand text-ink rounded-tl-none border border-gold/25"
              : "bg-sand text-ink rounded-tl-none"
        }`}
      >
        <p>{text}</p>

        {/* Fallback rephrase suggestion */}
        {usedFallback && (
          <div className="mt-3 pt-3 border-t border-ink/10 space-y-1.5">
            <p className="text-xs text-ink/50 leading-relaxed">
              I couldn't find a specific answer in my knowledge base for this question.{' '}
              Try rephrasing your question, or check the{' '}
              <Link to="/ritual-guide" className="text-emerald underline hover:no-underline font-medium">Ritual Guide</Link>{' '}
              and{' '}
              <Link to="/emergency" className="text-emerald underline hover:no-underline font-medium">Emergency Contacts</Link>{' '}
              for more information.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ErrorBubble — inline, fades in like any message
// ═══════════════════════════════════════════════════════════════

function ErrorBubble({ message }) {
  const bubbleRef = useRef(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!bubbleRef.current) return;

    const ctx = gsap.context(() => {
      if (prefersReduced) {
        gsap.set(bubbleRef.current, { opacity: 1 });
        return;
      }
      gsap.fromTo(
        bubbleRef.current,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }
      );
    });

    return () => ctx.revert();
  }, [prefersReduced]);

  return (
    <div ref={bubbleRef} className="flex justify-center">
      <div className="inline-flex items-center gap-2 rounded-xl border border-clay-alert/15 bg-clay-alert/[0.03] px-4 py-2.5 text-sm text-clay-alert/80">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <span>{message}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  Main AskPilgrim
// ═══════════════════════════════════════════════════════════════

export default function AskPilgrim() {
  const { t } = useTranslation();

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Assalamu Alaikum! I'm your Hajj & Umrah assistant. Ask me anything about the rituals, Ihram rules, duas, locations, or how to prepare for your pilgrimage.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [chipsAnimated, setChipsAnimated] = useState(false);

  const listRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Animate chips once
  useEffect(() => {
    if (!chipsAnimated && messages.length <= 1) {
      // Brief delay so the welcome message animates first
      const id = setTimeout(() => setChipsAnimated(true), 500);
      return () => clearTimeout(id);
    }
  }, [chipsAnimated, messages.length]);

  // Hide chips after first user message
  useEffect(() => {
    if (messages.some((m) => m.role === "user")) {
      setShowSuggestions(false);
    }
  }, [messages]);

  // ── Send message (accepts optional override to avoid stale closure) ──
  const handleSend = useCallback(
    async (overrideQuestion) => {
      const question = (
        typeof overrideQuestion === "string" ? overrideQuestion : input
      ).trim();
      if (!question || loading) return;

      setMessages((prev) => [...prev, { role: "user", text: question }]);
      setInput("");
      setLoading(true);
      setError("");

      try {
        const res = await api.post("/api/chat", { question });
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: res.data.answer,
            usedFallback: res.data.usedFallback,
          },
        ]);
      } catch (err) {
        const msg =
          err.response?.data?.error ||
          "Unable to get an answer right now. Please try again.";
        setError(msg);
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [input, loading]
  );

  // ── Handle chip select ──
  const handleChipSelect = useCallback(
    (question) => {
      setInput(question);
      // Auto-submit after brief delay so user sees the chip fill the input
      setTimeout(() => {
        inputRef.current?.focus();
        handleSend(question); // pass question directly to avoid stale closure
      }, 100);
    },
    [handleSend]
  );

  // ── Key handler ──
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="flex flex-col min-h-[calc(100vh-7rem)] w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
      {/* ── Header ── */}
      <div className="mb-4">
        <h1 className="font-display text-3xl lg:text-4xl font-semibold text-ink leading-tight">
          {t("askPilgrim.title", "Ask a Pilgrim")}
        </h1>
        <p className="text-sm text-ink/50 mt-1 font-mono">
          {t(
            "askPilgrim.subtitle",
            "Your personal AI guide for Hajj & Umrah questions"
          )}
        </p>
      </div>

      {/* ── Guidance note (static, no animation) ── */}
      <div className="mb-4">
        <GuidanceNote />
      </div>

      {/* ── Chat panel ── */}
      <div className="flex-1 min-h-[480px] rounded-2xl border border-ink/10 bg-paper flex flex-col overflow-hidden">
        {/* Message list */}
        <div
          ref={listRef}
          className="flex-1 min-h-0 overflow-y-auto px-4 lg:px-6 py-6 space-y-4 scroll-smooth"
        >
          {messages.map((msg, i) => (
            <ChatBubble key={i} role={msg.role} text={msg.text} usedFallback={msg.usedFallback} />
          ))}

          {/* Typing indicator */}
          {loading && <TypingIndicator />}

          {/* Error bubble (inline, like any other message) */}
          {error && <ErrorBubble message={error} />}

          {/* Suggested chips (before first user message) */}
          {showSuggestions && chipsAnimated && !loading && (
            <div className="pt-2">
              <p className="text-xs font-mono text-ink/30 mb-3">
                Try asking:
              </p>
              <SuggestedChips
                onSelect={handleChipSelect}
                visible={chipsAnimated}
              />
            </div>
          )}

          {/* Bottom spacer */}
          <div className="h-2" />
        </div>

        {/* Input area */}
        <div className="shrink-0 border-t border-ink/8 px-4 lg:px-6 py-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t(
                  "askPilgrim.placeholder",
                  "Ask about Hajj, Umrah, Ihram rules, duas…"
                )}
                rows={1}
                className="w-full rounded-xl border border-ink/12 bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-all duration-200 resize-none"
                style={{ minHeight: "44px", maxHeight: "120px" }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height =
                    Math.min(e.target.scrollHeight, 120) + "px";
                }}
              />
            </div>

            {/* Send button */}
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 rounded-xl bg-emerald p-3 text-paper hover:bg-emerald/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              aria-label="Send message"
            >
              {loading ? (
                <svg width="20" height="20" viewBox="0 0 20 20" className="animate-spin" aria-hidden="true">
                  <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                  <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="50" strokeDashoffset="35" strokeLinecap="round" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              )}
            </button>
          </div>

          <p className="mt-1.5 text-xs text-ink/30 text-center font-mono">
            {t("askPilgrim.enterHint", "Press Enter to send · Shift+Enter for new line")}
          </p>
        </div>
      </div>
    </div>
  );
}