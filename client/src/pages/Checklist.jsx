"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../components/Alert";
import SlidingPill from "../components/SlidingPill";
import useReducedMotion from "../hooks/useReducedMotion";

// ═══════════════════════════════════════════════════════════════
//  Checkbox — SVG checkmark draw-on animation
// ═══════════════════════════════════════════════════════════════

function AnimatedCheckbox({ checked, onToggle, disabled }) {
  const boxRef = useRef(null);
  const pathRef = useRef(null);

  // Animate the checkmark path drawing
  useEffect(() => {
    if (!pathRef.current) return;

    const ctx = gsap.context(() => {
      if (checked) {
        // Draw the checkmark
        gsap.fromTo(
          pathRef.current,
          { strokeDashoffset: 24 },
          {
            strokeDashoffset: 0,
            duration: 0.25,
            ease: "power2.out",
          }
        );
      } else {
        // Erase it instantly
        gsap.set(pathRef.current, { strokeDashoffset: 24 });
      }
    });

    return () => ctx.revert();
  }, [checked]);

  // Scale bounce on the box when toggled
  useEffect(() => {
    if (!boxRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "back.out(2.5)" } });
      tl.to(boxRef.current, { scale: 1.15, duration: 0.08 }, 0);
      tl.to(boxRef.current, { scale: 1, duration: 0.15 }, 0.06);
    });

    return () => ctx.revert();
  }, [checked]);

  return (
    <div
      ref={boxRef}
      className={`relative w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
        checked
          ? "bg-emerald border-emerald"
          : "border-ink/20 bg-transparent"
      }`}
      style={{ willChange: "transform" }}
    >
      <svg
        className="w-3.5 h-3.5 text-paper"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path
          ref={pathRef}
          d="M5 13l4 4L19 7"
          strokeDasharray={24}
          strokeDashoffset={checked ? 0 : 24}
          style={{ willChange: "stroke-dashoffset" }}
        />
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ChecklistItem — one row with group-aware rendering
// ═══════════════════════════════════════════════════════════════

function ChecklistItem({ item, onToggle, toggling, showGroup, groupLabel }) {
  const rowRef = useRef(null);

  return (
    <div ref={rowRef} data-item-id={item._id}>
      {/* Group header label */}
      {showGroup && groupLabel && (
        <div className="pt-5 pb-2 first:pt-0">
          <span className="font-mono text-[11px] uppercase tracking-widest text-ink/35">
            {groupLabel}
          </span>
        </div>
      )}

      {/* Item row */}
      <label
        className={`flex items-start gap-3 rounded-xl p-3.5 transition-all duration-200 cursor-pointer border ${
          item.isChecked
            ? "bg-emerald/[0.04] border-emerald/15"
            : "bg-paper border-ink/8 hover:border-ink/20"
        } ${toggling ? "opacity-50 pointer-events-none" : ""}`}
      >
        <input
          type="checkbox"
          checked={item.isChecked}
          onChange={() => onToggle(item._id, !item.isChecked)}
          disabled={toggling}
          className="sr-only"
          aria-label={item.label}
        />

        <AnimatedCheckbox
          checked={item.isChecked}
          onToggle={() => onToggle(item._id, !item.isChecked)}
          disabled={toggling}
        />

        <span
          className={`text-sm leading-relaxed transition-all duration-200 ${
            item.isChecked
              ? "text-ink/40 line-through"
              : "text-ink"
          }`}
        >
          {item.label}
        </span>
      </label>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  AddItemForm — animated new item entry
// ═══════════════════════════════════════════════════════════════

function AddItemForm({ onAdd, adding }) {
  const [label, setLabel] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setLabel("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Add a custom item…"
        disabled={adding}
        className="w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-all duration-200 disabled:opacity-40"
      />
      <button
        type="submit"
        disabled={!label.trim() || adding}
        className="px-4 py-3 rounded-xl bg-emerald text-paper text-sm font-semibold hover:bg-emerald/90 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
      >
        {adding ? (
          <svg width="18" height="18" viewBox="0 0 18 18" className="animate-spin" aria-hidden="true">
            <circle cx="9" cy="9" r="7" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
            <circle cx="9" cy="9" r="7" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="44" strokeDashoffset="30" strokeLinecap="round" />
          </svg>
        ) : (
          "Add"
        )}
      </button>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ProgressHeader — ArcRing + bar + count
// ═══════════════════════════════════════════════════════════════

function ProgressHeader({ checkedCount, totalItems }) {
  const ringRef = useRef(null);
  const barRef = useRef(null);
  const prefersReduced = useReducedMotion();
  const isMountedRef = useRef(false);

  const pct = totalItems > 0 ? checkedCount / totalItems : 0;
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference * (1 - pct);

  // GSAP tween when percentage changes
  useEffect(() => {
    if (!ringRef.current || !barRef.current) return;

    const ctx = gsap.context(() => {
      if (!isMountedRef.current) {
        // First render — set correct state instantly, no animation
        gsap.set(ringRef.current, { strokeDashoffset: targetOffset });
        gsap.set(barRef.current, { scaleX: pct });
        isMountedRef.current = true;
        return;
      }

      if (prefersReduced) {
        gsap.set(ringRef.current, { strokeDashoffset: targetOffset });
        gsap.set(barRef.current, { scaleX: pct });
        return;
      }

      // Quick GSAP tween on ring — feels immediate and satisfying
      gsap.to(ringRef.current, {
        strokeDashoffset: targetOffset,
        duration: 0.35,
        ease: "power3.out",
      });

      // Bar fill
      gsap.to(barRef.current, {
        scaleX: pct,
        duration: 0.3,
        ease: "power2.out",
      });
    });

    return () => ctx.revert();
  }, [pct, targetOffset, circumference, prefersReduced]);

  const displayPct = totalItems > 0 ? Math.round(pct * 100) : 0;

  return (
    <div className="flex items-center gap-4">
      {/* SVG ring */}
      <div className="relative flex-shrink-0" style={{ width: 52, height: 52 }}>
        <svg
          width={52}
          height={52}
          viewBox="0 0 52 52"
          className="transform -rotate-90"
          role="progressbar"
          aria-valuenow={displayPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Checklist progress: ${displayPct}%`}
        >
          <circle
            cx="26" cy="26" r={radius}
            fill="none"
            stroke="rgba(47, 82, 51, 0.1)"
            strokeWidth="3.5"
          />
          <circle
            ref={ringRef}
            cx="26" cy="26" r={radius}
            fill="none"
            stroke="var(--emerald, #2F5233)"
            strokeWidth="3.5"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            strokeLinecap="round"
            style={{ willChange: "stroke-dashoffset" }}
          />
        </svg>
        {/* Center percentage */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-xs font-semibold text-ink">
            {displayPct}
          </span>
        </div>
      </div>

      {/* Progress bar + count */}
      <div className="flex-1 min-w-0">
        <div className="h-1.5 bg-ink/8 rounded-full overflow-hidden">
          <div
            ref={barRef}
            className="h-full bg-emerald rounded-full"
            style={{
              transformOrigin: "left center",
              transform: `scaleX(${prefersReduced ? pct : 0})`,
              willChange: "transform",
            }}
          />
        </div>
        <p className="text-xs font-mono text-ink/40 mt-1">
          {checkedCount}/{totalItems} complete
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  Main ChecklistPage
// ═══════════════════════════════════════════════════════════════

export default function ChecklistPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { addAlert } = useAlert();
  const userId = user?._id || user?.id;

  const [mode, setMode] = useState("preparation");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const listRef = useRef(null);

  // ── Load checklist ──
  const loadChecklist = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/api/checklist/${userId}?type=${mode}`);
      setItems(res.data.items);
      setInitialLoadDone(true);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to load checklist.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [userId, mode]);

  useEffect(() => {
    loadChecklist();
  }, [loadChecklist]);

  // ── Stagger items in on first load ──
  useEffect(() => {
    if (!initialLoadDone || !listRef.current || loading) return;

    const itemEls = listRef.current.querySelectorAll("[data-item-id]");
    if (itemEls.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        itemEls,
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.05,
          ease: "power3.out",
        }
      );
    });

    return () => ctx.revert();
  }, [initialLoadDone, loading, mode]);

  // ── Toggle item ──
  const handleToggle = async (itemId, isChecked) => {
    setToggling(itemId);
    setItems((prev) =>
      prev.map((item) =>
        item._id === itemId ? { ...item, isChecked } : item
      )
    );

    try {
      await api.patch(`/api/checklist/${userId}`, {
        type: mode,
        itemId,
        isChecked,
      });
      if (isChecked) addAlert("Item checked off!", "success");
    } catch {
      setItems((prev) =>
        prev.map((item) =>
          item._id === itemId
            ? { ...item, isChecked: !isChecked }
            : item
        )
      );
    } finally {
      setToggling(null);
    }
  };

  // ── Add custom item — animates new row in ──
  const handleAdd = async (label) => {
    const prevCount = items.length;
    setAdding(true);
    try {
      const res = await api.patch(`/api/checklist/${userId}`, {
        type: mode,
        newItemLabel: label,
      });
      setItems(res.data.items);
      addAlert("Item added!", "success");

      // Animate the new item row after render
      setTimeout(() => {
        const allItems = listRef.current?.querySelectorAll("[data-item-id]");
        if (allItems && allItems.length > prevCount) {
          // The new item is the last one
          const newEl = allItems[allItems.length - 1];
          gsap.fromTo(
            newEl,
            { opacity: 0, y: -12, scale: 0.97 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.4,
              ease: "power3.out",
            }
          );
          newEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);
    } catch (err) {
      const msg =
        err.response?.data?.error || "Failed to add item.";
      setError(msg);
    } finally {
      setAdding(false);
    }
  };

  // ── Group items for display ──
  const groupOrder =
    mode === "preparation"
      ? ["Documents", "Ihram & Clothing", "Health & Hygiene", "Essentials"]
      : ["Beginning", "Core Rites", "Completion"];

  const groupedItems = {};
  items.forEach((item) => {
    const g = item.group || "";
    if (!groupedItems[g]) groupedItems[g] = [];
    groupedItems[g].push(item);
  });

  // Sort groups by the defined order
  const sortedGroups = groupOrder.filter((g) => groupedItems[g]);

  // Items without a group or in an unrecognised group
  const otherItems = items.filter(
    (item) => !item.group || !groupOrder.includes(item.group)
  );

  const checkedCount = items.filter((i) => i.isChecked).length;

  // ── Loading state ──
  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <svg width="48" height="48" viewBox="0 0 48 48" className="animate-spin" aria-hidden="true">
          <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(47, 82, 51, 0.12)" strokeWidth="3" />
          <circle cx="24" cy="24" r="20" fill="none" stroke="var(--emerald)" strokeWidth="3" strokeDasharray="126" strokeDashoffset="90" strokeLinecap="round" />
        </svg>
        <span className="sr-only">Loading checklist…</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 lg:py-12">
      {/* ── Header ── */}
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl lg:text-4xl font-semibold text-ink leading-tight">
          {t("checklist.title", "Checklist")}
        </h1>
        <p className="text-sm text-ink/50 mt-2 font-mono">
          {mode === "preparation"
            ? t("checklist.prepSubtitle", "Pack and prepare before you depart")
            : t("checklist.ritualSubtitle", "Track your ritual progress step by step")}
        </p>
      </div>

      {/* ── Mode toggle ── */}
      <div className="mb-6 flex justify-center">
        <SlidingPill
          options={[
            { key: "preparation", label: t("checklist.preparation", "Preparation") },
            { key: "ritual", label: t("checklist.ritual", "Ritual Progress") },
          ]}
          value={mode}
          onChange={setMode}
          className="w-full max-w-xs"
        />
      </div>

      {/* ── Progress header ── */}
      <div className="mb-6 rounded-2xl border border-ink/10 bg-paper p-4 lg:p-5">
        <ProgressHeader checkedCount={checkedCount} totalItems={items.length} />
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mb-6 rounded-xl border border-clay-alert/20 bg-clay-alert/5 px-5 py-3 text-sm text-clay-alert text-center flex items-center justify-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* ── List items ── */}
      <div ref={listRef} className="space-y-1 mb-6">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-ink/5 flex items-center justify-center">
              <svg className="w-7 h-7 text-ink/20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <p className="text-sm text-ink/40 font-mono">
              {t("checklist.empty", "No items yet. Add one below.")}
            </p>
          </div>
        ) : (
          <>
            {/* Render grouped items */}
            {sortedGroups.map((groupName) => {
              const groupItems = groupedItems[groupName];
              return groupItems.map((item, idx) => (
                <ChecklistItem
                  key={item._id}
                  item={item}
                  onToggle={handleToggle}
                  toggling={toggling === item._id}
                  showGroup={idx === 0}
                  groupLabel={groupName}
                />
              ));
            })}

            {/* Render ungrouped items */}
            {otherItems.map((item, idx) => (
              <ChecklistItem
                key={item._id}
                item={item}
                onToggle={handleToggle}
                toggling={toggling === item._id}
                showGroup={idx === 0 && sortedGroups.length > 0}
                groupLabel=""
              />
            ))}
          </>
        )}
      </div>

      {/* ── Add custom item (Preparation only) ── */}
      {mode === "preparation" && (
        <div className="rounded-2xl border border-ink/10 bg-sand/30 p-4 lg:p-5">
          <span className="font-mono text-[11px] uppercase tracking-widest text-ink/35 block mb-3">
            {t("checklist.addCustom", "Add Custom Item")}
          </span>
          <AddItemForm onAdd={handleAdd} adding={adding} />
        </div>
      )}
    </div>
  );
}
