"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/pricing";
import {
  DefaultEmailResult,
  fetchAdminInstallments,
  InstallmentFilter,
  InstallmentPagination,
  InstallmentRecord,
  InstallmentSummary,
  InstallmentUser,
  sendDefaultEmails,
} from "@/lib/installments";

const PAGE_SIZE = 20;

const FILTERS: { value: InstallmentFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "defaulting", label: "Defaulting" },
  { value: "current", label: "On track" },
];

const formatDate = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const formatDateTime = (value: string) => new Date(value).toLocaleString();

export default function AdminInstallmentsPage() {
  const [users, setUsers] = useState<InstallmentUser[]>([]);
  const [summary, setSummary] = useState<InstallmentSummary | null>(null);
  const [pagination, setPagination] = useState<InstallmentPagination | null>(null);
  const [filter, setFilter] = useState<InstallmentFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reloadTick, setReloadTick] = useState(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sendingAll, setSendingAll] = useState(false);
  const [result, setResult] = useState<{ title: string; data: DefaultEmailResult } | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Debounce search so we don't refetch on every keystroke.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const requestKey = `${filter}|${search}|${page}|${reloadTick}`;
  const loading = loadedKey !== requestKey;
  const reload = () => setReloadTick((tick) => tick + 1);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const res = await fetchAdminInstallments({ filter, search, page, limit: PAGE_SIZE });
      if (cancelled) return;
      if (res.ok) {
        setUsers(res.users);
        setSummary(res.summary);
        setPagination(res.pagination);
        setError("");
      } else {
        setError(res.message);
      }
      setLoadedKey(requestKey);
    })();

    return () => {
      cancelled = true;
    };
    // requestKey is derived from the deps below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search, page, reloadTick]);

  const changeFilter = (next: InstallmentFilter) => {
    setFilter(next);
    setPage(1);
  };

  const showResult = (title: string, data: DefaultEmailResult) => {
    setResult({ title, data });
    setNotice(null);
  };

  const handleSendOne = async (user: InstallmentUser) => {
    const resend = user.last_default_email_at
      ? `\n\nThey were last emailed on ${formatDateTime(user.last_default_email_at)}.`
      : "";
    if (!confirm(`Send a default notice to ${user.name} (${user.email})?${resend}`)) return;

    setSendingId(user.user_id);
    setResult(null);
    // force: an admin clicking a specific user has made an explicit decision to (re)send.
    const res = await sendDefaultEmails({ user_ids: [user.user_id], force: true });
    if (res.ok) {
      showResult(`Notice for ${user.name}`, res.result);
      reload();
    } else {
      setNotice({ type: "error", text: res.message });
    }
    setSendingId(null);
  };

  const handleSendAll = async () => {
    const count = summary?.defaulting_users ?? 0;
    if (count === 0) return;
    if (
      !confirm(
        `Email all ${count} defaulting user${count === 1 ? "" : "s"}?\n\nUsers already emailed in the last 24 hours are skipped automatically.`
      )
    )
      return;

    setSendingAll(true);
    setResult(null);
    const res = await sendDefaultEmails({ all: true });
    if (res.ok) {
      showResult("Bulk default notices", res.result);
      reload();
    } else {
      setNotice({ type: "error", text: res.message });
    }
    setSendingAll(false);
  };

  const nameFor = (userId: string, email: string | null) =>
    users.find((u) => u.user_id === userId)?.name ?? email ?? userId;

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Installment Tracker</h1>
          <p className="text-white/50 text-sm">
            Users with installment payments still to be paid, their monthly payment record, and any months they missed.
          </p>
        </div>
        <button
          onClick={handleSendAll}
          disabled={sendingAll || !summary?.defaulting_users}
          className="px-5 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {sendingAll ? "Sending..." : `Email all defaulters${summary?.defaulting_users ? ` (${summary.defaulting_users})` : ""}`}
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard label="Users on plans" value={String(summary.total_users)} />
          <StatCard label="Defaulting" value={String(summary.defaulting_users)} tone="red" />
          <StatCard label="Missed months" value={String(summary.total_missed_installments)} tone="red" />
          <StatCard label="Overdue" value={formatMoney(summary.total_overdue_amount)} tone="red" />
          <StatCard label="Still outstanding" value={formatMoney(summary.total_outstanding_amount)} />
        </div>
      )}

      {notice && <p className={`text-sm ${notice.type === "success" ? "text-emerald-300" : "text-red-300"}`}>{notice.text}</p>}

      {result && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-bold">{result.title}</h2>
              <p className="text-sm text-white/60">
                <span className="text-emerald-300">{result.data.sent.length} sent</span> ·{" "}
                <span className="text-amber-300">{result.data.skipped.length} skipped</span> ·{" "}
                <span className="text-red-300">{result.data.failed.length} failed</span>
              </p>
            </div>
            <button onClick={() => setResult(null)} className="text-white/40 hover:text-white text-sm" aria-label="Dismiss">
              ✕
            </button>
          </div>
          {[...result.data.skipped, ...result.data.failed].length > 0 && (
            <ul className="text-sm space-y-1 text-white/60">
              {result.data.skipped.map((item) => (
                <li key={`s-${item.user_id}`}>
                  <span className="text-amber-300">Skipped</span> {nameFor(item.user_id, item.email)} — {item.reason}
                </li>
              ))}
              {result.data.failed.map((item) => (
                <li key={`f-${item.user_id}`}>
                  <span className="text-red-300">Failed</span> {nameFor(item.user_id, item.email)} — {item.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((item) => {
            const count =
              item.value === "all"
                ? summary?.total_users
                : item.value === "defaulting"
                  ? summary?.defaulting_users
                  : summary?.current_users;
            return (
              <button
                key={item.value}
                onClick={() => changeFilter(item.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  filter === item.value
                    ? "bg-blue-500/20 border-blue-500/40 text-white"
                    : "border-white/10 text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.label}
                {count !== undefined && <span className="ml-2 text-white/40">{count}</span>}
              </button>
            );
          })}
        </div>
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search name, email or order ref"
          className="w-full md:w-72 px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-blue-500/50 text-sm"
        />
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-white/50">
        <Legend className="bg-emerald-500/20 border-emerald-500/40" label="Paid" />
        <Legend className="bg-emerald-500/20 border-amber-400" label="Paid late" />
        <Legend className="bg-red-500/20 border-red-500/50" label="Missed" />
        <Legend className="bg-white/5 border-white/15" label="Upcoming" />
      </div>

      {error ? (
        <div className="text-red-300 text-sm border border-red-500/30 bg-red-500/10 rounded-xl p-4">{error}</div>
      ) : loading && users.length === 0 ? (
        <div className="text-white/40 animate-pulse">Loading...</div>
      ) : users.length === 0 ? (
        <div className="text-white/40 text-sm text-center py-12 border border-dashed border-white/10 rounded-2xl">
          No users match this view.
        </div>
      ) : (
        <div className={`space-y-4 transition-opacity ${loading ? "opacity-60" : ""}`}>
          {users.map((user) => (
            <UserCard
              key={user.user_id}
              user={user}
              open={!!expanded[user.user_id]}
              onToggle={() => setExpanded((prev) => ({ ...prev, [user.user_id]: !prev[user.user_id] }))}
              onSend={() => handleSendOne(user)}
              sending={sendingId === user.user_id}
              disableSend={sendingAll}
            />
          ))}
        </div>
      )}

      {pagination && pagination.total > pagination.limit && (
        <div className="flex items-center justify-between text-sm text-white/50">
          <span>
            Page {pagination.page} of {Math.max(Math.ceil(pagination.total / pagination.limit), 1)} · {pagination.total} users
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1 || loading}
              className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.has_more || loading}
              className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "red" }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <p className="text-xs text-white/40 uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-bold mt-1 break-words ${tone === "red" ? "text-red-300" : ""}`}>{value}</p>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`w-3 h-3 rounded border ${className}`} />
      {label}
    </span>
  );
}

function UserCard({
  user,
  open,
  onToggle,
  onSend,
  sending,
  disableSend,
}: {
  user: InstallmentUser;
  open: boolean;
  onToggle: () => void;
  onSend: () => void;
  sending: boolean;
  disableSend: boolean;
}) {
  return (
    <div className={`rounded-2xl border ${user.is_defaulting ? "border-red-500/30 bg-red-500/[0.04]" : "border-white/10 bg-white/5"}`}>
      <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center gap-4">
        <button onClick={onToggle} className="flex-1 min-w-0 text-left" aria-expanded={open}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold truncate">{user.name}</span>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                user.is_defaulting
                  ? "bg-red-500/15 text-red-300 border-red-500/30"
                  : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
              }`}
            >
              {user.is_defaulting ? `Defaulting · ${user.missed_count} missed` : "On track"}
            </span>
          </div>
          <p className="text-sm text-white/50 truncate">{user.email}</p>
          <p className="text-xs text-white/40 mt-1">
            {user.paid_count}/{user.total_installments} months paid
            {user.is_defaulting && ` · ${user.max_days_overdue} days overdue at worst`}
            {user.last_default_email_at && ` · Last notice ${formatDateTime(user.last_default_email_at)} (${user.default_emails_sent} sent)`}
          </p>
        </button>

        <div className="flex items-center gap-6 lg:text-right">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/40">Overdue</p>
            <p className={`font-bold ${user.overdue_amount > 0 ? "text-red-300" : "text-white/60"}`}>{formatMoney(user.overdue_amount)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/40">Outstanding</p>
            <p className="font-bold">{formatMoney(user.outstanding_amount)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user.is_defaulting && (
            <button
              onClick={onSend}
              disabled={sending || disableSend}
              className="px-4 py-2 rounded-lg bg-red-500/90 hover:bg-red-400 text-white text-sm font-semibold disabled:opacity-40 transition-colors"
            >
              {sending ? "Sending..." : "Send notice"}
            </button>
          )}
          <button
            onClick={onToggle}
            className="px-3 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm"
            aria-label={open ? "Hide payment record" : "Show payment record"}
          >
            {open ? "Hide" : "Details"}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 p-4 sm:p-5 space-y-5">
          {user.orders.map((order) => (
            <div key={order.order_id} className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">
                    Order #{order.order_ref}
                    {order.order_summary && <span className="font-normal text-white/50"> · {order.order_summary}</span>}
                  </p>
                  <p className="text-xs text-white/40">
                    Total {formatMoney(order.total_amount)} · Paid {formatMoney(order.paid_amount)} · Remaining {formatMoney(order.remaining_balance)}
                    {!order.deposit_paid && <span className="text-amber-300"> · Deposit not fully paid</span>}
                  </p>
                </div>
                {order.missed_count > 0 && (
                  <p className="text-xs text-red-300 font-semibold">
                    {order.missed_count} missed · {formatMoney(order.overdue_amount)} overdue
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {order.installments.map((installment) => (
                  <InstallmentChip key={installment.id} installment={installment} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InstallmentChip({ installment }: { installment: InstallmentRecord }) {
  const styles =
    installment.status === "PAID"
      ? installment.paid_late
        ? "bg-emerald-500/10 border-amber-400/70"
        : "bg-emerald-500/10 border-emerald-500/40"
      : installment.status === "MISSED"
        ? "bg-red-500/10 border-red-500/50"
        : "bg-white/5 border-white/15";

  const label =
    installment.status === "PAID"
      ? installment.paid_late
        ? "Paid late"
        : "Paid"
      : installment.status === "MISSED"
        ? `Missed · ${installment.days_overdue}d overdue`
        : "Upcoming";

  const labelColor =
    installment.status === "PAID"
      ? installment.paid_late
        ? "text-amber-300"
        : "text-emerald-300"
      : installment.status === "MISSED"
        ? "text-red-300"
        : "text-white/40";

  return (
    <div className={`rounded-xl border p-3 ${styles}`}>
      <div className="flex items-center justify-between text-xs text-white/50">
        <span>Month {installment.installment_number}</span>
        <span>{formatDate(installment.due_date)}</span>
      </div>
      <p className="font-bold mt-1">{formatMoney(installment.amount)}</p>
      <p className={`text-xs font-semibold mt-0.5 ${labelColor}`}>{label}</p>
      {installment.paid_at && <p className="text-[10px] text-white/40 mt-0.5">on {formatDate(installment.paid_at.slice(0, 10))}</p>}
    </div>
  );
}
