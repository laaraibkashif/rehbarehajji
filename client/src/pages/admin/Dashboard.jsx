"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../../services/api";

// ── Design tokens ──
const COLORS = {
  emerald: "#2F5233",
  gold: "#B8863E",
  sand: "#EBE3CE",
  ink: "#16241C",
  emeraldLight: "rgba(47, 82, 51, 0.12)",
  goldLight: "rgba(184, 134, 62, 0.12)",
  emeraldFaded: "rgba(47, 82, 51, 0.06)",
};

// ── Helpers ──

function formatNumber(n) {
  if (n == null) return "—";
  return Number(n).toLocaleString();
}

function formatDateStr(d) {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getDefaultRange() {
  const to = new Date();
  const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

// ── Spinner ──
function Spinner({ className = "w-6 h-6" }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ── KPICard ──
function KPICard({ label, value, icon, subtitle }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-paper p-5 flex items-start gap-4">
      <div className="w-12 h-12 rounded-full bg-emerald/10 flex items-center justify-center text-emerald flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-ink font-mono leading-none">{formatNumber(value)}</p>
        <p className="text-xs text-ink/50 mt-1.5">{label}</p>
        {subtitle && <p className="text-[10px] text-ink/30 mt-0.5 font-mono">{subtitle}</p>}
      </div>
    </div>
  );
}

// ── ChartCard ──
function ChartCard({ title, subtitle, children, className = "" }) {
  return (
    <div className={`rounded-xl border border-ink/10 bg-paper p-5 lg:p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
        {subtitle && <p className="text-xs text-ink/40 mt-0.5 font-mono">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ── DateRangePicker ──
function DateRangePicker({ from, to, onChange }) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-ink/50 font-mono">From</label>
        <input
          type="date"
          value={from}
          onChange={(e) => onChange({ from: e.target.value, to })}
          className="rounded-lg border border-ink/15 bg-paper px-3 py-1.5 text-sm text-ink font-mono focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-all"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-ink/50 font-mono">To</label>
        <input
          type="date"
          value={to}
          onChange={(e) => onChange({ from, to: e.target.value })}
          className="rounded-lg border border-ink/15 bg-paper px-3 py-1.5 text-sm text-ink font-mono focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-all"
        />
      </div>
      {/* Quick presets */}
      <div className="flex items-center gap-1">
        {[
          { label: "7d", days: 7 },
          { label: "30d", days: 30 },
          { label: "90d", days: 90 },
        ].map((preset) => {
          const d = new Date();
          d.setDate(d.getDate() - preset.days);
          const pFrom = d.toISOString().split("T")[0];
          const pTo = new Date().toISOString().split("T")[0];
          return (
            <button
              key={preset.label}
              onClick={() => onChange({ from: pFrom, to: pTo })}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-ink/5 text-ink/50 hover:text-ink hover:bg-ink/10 transition-all"
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Custom Tooltip ──
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-ink/10 bg-paper shadow-lg px-4 py-3 text-sm">
      <p className="text-xs text-ink/40 font-mono mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="font-semibold" style={{ color: entry.color }}>
          {entry.name}: {formatNumber(entry.value)}
        </p>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  Main AdminDashboard
// ══════════════════════════════════════════════════════════════

export default function AdminDashboard() {
  const { t } = useTranslation();

  // Date range
  const defaultRange = getDefaultRange();
  const [dateRange, setDateRange] = useState(defaultRange);
  const [loading, setLoading] = useState(true);

  // Data
  const [summary, setSummary] = useState(null);
  const [usersGrowth, setUsersGrowth] = useState([]);
  const [plansByType, setPlansByType] = useState(null);
  const [ritualEngagement, setRitualEngagement] = useState([]);
  const [chatbotUsage, setChatbotUsage] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const params = { from: dateRange.from, to: dateRange.to };
    try {
      const [summaryRes, growthRes, plansRes, engagementRes, chatbotRes] = await Promise.all([
        api.get("/api/admin/analytics/summary", { params }),
        api.get("/api/admin/analytics/users-growth", { params }),
        api.get("/api/admin/analytics/plans-by-type", { params }),
        api.get("/api/admin/analytics/ritual-engagement", { params }),
        api.get("/api/admin/analytics/chatbot-usage", { params }),
      ]);
      setSummary(summaryRes.data.summary);
      setUsersGrowth(growthRes.data.daily || []);
      setPlansByType(plansRes.data);
      setRitualEngagement(engagementRes.data.engagement || []);
      setChatbotUsage(chatbotRes.data);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Prepare chart data ──

  // Users growth: handle sparse days by filling gaps
  const userGrowthChartData = (() => {
    if (!usersGrowth.length) return [];
    const from = new Date(dateRange.from);
    const to = new Date(dateRange.to);
    const map = {};
    usersGrowth.forEach((d) => { map[d.date] = d.count; });
    const data = [];
    const cursor = new Date(from);
    while (cursor <= to) {
      const key = cursor.toISOString().split("T")[0];
      data.push({ date: formatDateStr(key), users: map[key] || 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    return data;
  })();

  // Plans by type: reshape for stacked bar
  const plansChartData = (() => {
    if (!plansByType?.breakdown?.length) return [];
    const groups = {};
    plansByType.breakdown.forEach((d) => {
      if (!groups[d.ritualType]) groups[d.ritualType] = { ritualType: d.ritualType };
      groups[d.ritualType][d.ageGroup] = d.count;
    });
    return Object.values(groups);
  })();

  // Ritual engagement: horizontal bar data
  const engagementChartData = (() => {
    if (!ritualEngagement.length) return [];
    return ritualEngagement.map((d) => ({
      name: d.name,
      ritualType: d.ritualType === "hajj" ? "H" : "U",
      users: d.planCount,
      step: `Step ${d.order}`,
    }));
  })();

  // Separate hajj/umrah engagement
  const hajjEngagement = engagementChartData.filter((d) => d.ritualType === "H");
  const umrahEngagement = engagementChartData.filter((d) => d.ritualType === "U");

  // Chatbot volume
  const chatVolumeData = (() => {
    if (!chatbotUsage?.dailyVolume?.length) return [];
    return chatbotUsage.dailyVolume.map((d) => ({
      date: formatDateStr(d.date),
      queries: d.count,
    }));
  })();

  // Top topics
  const topTopics = chatbotUsage?.topTopics || [];

  // ── KPI icon generators ──
  const KpiIcon = ({ type }) => {
    switch (type) {
      case "users":
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
        );
      case "plans":
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case "tawaf":
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.712 4.33a9.027 9.027 0 011.652 1.306c.51.51.944 1.064 1.306 1.652M16.712 4.33l-3.448 4.138m3.448-4.138a9.014 9.014 0 00-9.424 0M19.67 7.288l-4.138 3.448m4.138-3.448a9.014 9.014 0 010 9.424m-4.138-5.976a3.736 3.736 0 00-.88-1.388 3.737 3.737 0 00-1.388-.88m2.268 2.268a3.765 3.765 0 010 2.528m-2.268-4.796l-3.448 4.138m0 0a3.736 3.736 0 00-.88 1.388 3.765 3.765 0 000 2.528m.88-3.916l-4.138 3.448m0 0a9.027 9.027 0 01-1.306 1.652 9.027 9.027 0 01-1.652 1.306m2.958-2.958l-3.448 4.138m3.448-4.138a9.014 9.014 0 010 9.424m-3.448-5.286a3.736 3.736 0 001.388.88 3.765 3.765 0 002.528 0m-3.916-.88l3.448 4.138" />
          </svg>
        );
      case "chat":
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-semibold text-ink">
            {t("admin.dashboardTitle", "Analytics Dashboard")}
          </h1>
          <p className="text-sm text-ink/50 mt-1 font-mono">
            {t("admin.dashboardSubtitle", "Platform metrics and trends.")}
          </p>
        </div>
        <DateRangePicker
          from={dateRange.from}
          to={dateRange.to}
          onChange={setDateRange}
        />
      </div>

      {loading && !summary ? (
        <div className="flex justify-center py-24">
          <Spinner className="w-10 h-10 text-emerald" />
        </div>
      ) : (
        <>
          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label={t("admin.kpiTotalUsers", "Total Pilgrims")}
              value={summary?.totalUsers}
              subtitle={t("admin.kpiAllTime", "All time")}
              icon={<KpiIcon type="users" />}
            />
            <KPICard
              label={t("admin.kpiActivePlans", "Active Plans")}
              value={summary?.activePlansThisMonth}
              subtitle={t("admin.kpiThisMonth", "This month")}
              icon={<KpiIcon type="plans" />}
            />
            <KPICard
              label={t("admin.kpiTawafTaps", "Tawaf Taps")}
              value={summary?.totalTawafTaps}
              subtitle={t("admin.kpiAllTime", "All time")}
              icon={<KpiIcon type="tawaf" />}
            />
            <KPICard
              label={t("admin.kpiChatQueries", "Chat Queries")}
              value={summary?.chatbotQueriesThisMonth}
              subtitle={t("admin.kpiThisMonth", "This month")}
              icon={<KpiIcon type="chat" />}
            />
          </div>

          {/* ── User Growth Line Chart ── */}
          <ChartCard
            title={t("admin.chartUserGrowth", "User Growth")}
            subtitle={t("admin.chartUserGrowthDesc", "New pilgrim registrations per day")}
          >
            {userGrowthChartData.length === 0 ? (
              <p className="text-sm text-ink/30 text-center py-12 font-mono">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={userGrowthChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.emeraldFaded} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fontFamily: "IBM Plex Mono, monospace", fill: "rgba(22,36,28,0.4)" }}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(22,36,28,0.08)" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fontFamily: "IBM Plex Mono, monospace", fill: "rgba(22,36,28,0.4)" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="users"
                    name="New Users"
                    stroke={COLORS.emerald}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: COLORS.emerald }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* ── Plans by Type Bar Chart + Totals ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title={t("admin.chartPlansByType", "Plans by Type & Age Group")}
              subtitle={t("admin.chartPlansByTypeDesc", "Generated plans broken down")}
            >
              {plansChartData.length === 0 ? (
                <p className="text-sm text-ink/30 text-center py-12 font-mono">No data</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={plansChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.emeraldFaded} />
                    <XAxis
                      dataKey="ritualType"
                      tick={{ fontSize: 11, fontFamily: "IBM Plex Mono, monospace", fill: "rgba(22,36,28,0.4)", textTransform: "capitalize" }}
                      tickLine={false}
                      axisLine={{ stroke: "rgba(22,36,28,0.08)" }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fontFamily: "IBM Plex Mono, monospace", fill: "rgba(22,36,28,0.4)" }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="child" name="Child" stackId="a" fill={COLORS.emerald} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="adult" name="Adult" stackId="a" fill={COLORS.gold} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="senior" name="Senior" stackId="a" fill={COLORS.sand} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Totals summary */}
            <ChartCard
              title={t("admin.plansTotals", "Plan Totals")}
              subtitle={t("admin.plansTotalsDesc", "Aggregate counts by ritual type")}
            >
              {plansByType?.totals?.length ? (
                <div className="space-y-4">
                  {plansByType.totals.map((t) => (
                    <div key={t.ritualType} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: t.ritualType === "hajj" ? COLORS.emerald : COLORS.gold }}
                        />
                        <span className="text-sm font-medium text-ink capitalize">{t.ritualType}</span>
                      </div>
                      <span className="text-lg font-bold font-mono text-ink">{formatNumber(t.total)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink/30 text-center py-12 font-mono">No data</p>
              )}
            </ChartCard>
          </div>

          {/* ── Ritual Engagement Horizontal Bar ── */}
          <ChartCard
            title={t("admin.chartEngagement", "Ritual-Step Engagement")}
            subtitle={t("admin.chartEngagementDesc", "How many plans include each step (shows drop-off points)")}
          >
            {engagementChartData.length === 0 ? (
              <p className="text-sm text-ink/30 text-center py-12 font-mono">No data</p>
            ) : (
              <div className="space-y-6">
                {/* Hajj steps */}
                {hajjEngagement.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-emerald uppercase tracking-wider mb-3 font-mono">Hajj</p>
                    <div className="space-y-2">
                      {hajjEngagement.map((d, i) => (
                        <EngagementBar key={i} data={d} color={COLORS.emerald} max={Math.max(...hajjEngagement.map((x) => x.users), 1)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Umrah steps */}
                {umrahEngagement.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gold uppercase tracking-wider mb-3 font-mono">Umrah</p>
                    <div className="space-y-2">
                      {umrahEngagement.map((d, i) => (
                        <EngagementBar key={i} data={d} color={COLORS.gold} max={Math.max(...umrahEngagement.map((x) => x.users), 1)} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ChartCard>

          {/* ── Chatbot Usage Area Chart + Topics ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartCard
              title={t("admin.chartChatVolume", "Chatbot Volume")}
              subtitle={t("admin.chartChatVolumeDesc", "Queries per day")}
              className="lg:col-span-2"
            >
              {chatVolumeData.length === 0 ? (
                <p className="text-sm text-ink/30 text-center py-12 font-mono">No data</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={chatVolumeData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="chatGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS.emerald} stopOpacity={0.15} />
                        <stop offset="100%" stopColor={COLORS.emerald} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.emeraldFaded} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fontFamily: "IBM Plex Mono, monospace", fill: "rgba(22,36,28,0.4)" }}
                      tickLine={false}
                      axisLine={{ stroke: "rgba(22,36,28,0.08)" }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 10, fontFamily: "IBM Plex Mono, monospace", fill: "rgba(22,36,28,0.4)" }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="queries"
                      name="Queries"
                      stroke={COLORS.emerald}
                      strokeWidth={2}
                      fill="url(#chatGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Top topics */}
            <ChartCard
              title={t("admin.topTopics", "Top Topics")}
              subtitle={t("admin.topTopicsDesc", "Most asked keywords")}
            >
              {topTopics.length === 0 ? (
                <p className="text-sm text-ink/30 text-center py-12 font-mono">No data</p>
              ) : (
                <div className="space-y-1.5 max-h-[260px] overflow-y-auto">
                  {topTopics.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-ink/5 last:border-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono text-ink/30 w-4 flex-shrink-0">{i + 1}.</span>
                        <span className="text-xs text-ink/70 truncate capitalize">{item.topic}</span>
                      </div>
                      <span className="text-xs font-mono text-emerald font-semibold flex-shrink-0 ml-2">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}

// ── EngagementBar (horizontal bar inline component) ──
function EngagementBar({ data, color, max }) {
  const pct = max > 0 ? (data.users / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-mono text-ink/40 w-4 flex-shrink-0 text-right">
        {data.step}
      </span>
      <span className="text-xs text-ink/70 flex-1 truncate">{data.name}</span>
      <span className="text-[11px] font-mono text-ink/50 w-10 text-right flex-shrink-0">{data.users}</span>
      <div className="w-24 h-2 bg-ink/5 rounded-full overflow-hidden flex-shrink-0">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
