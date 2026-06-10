"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../../../components/Navbar";
import { AnimatePresence, motion } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.cbrixi.com";

interface UserProfile {
  firstname: string;
  lastname: string;
  username: string;
  email: string;
}

type OrderStatus = "AWAITING_APPROVAL" | "PENDING" | "PARTIALLY_PAID" | "PAID" | "REJECTED";
type PaymentMethod = "PAYSTACK" | "BANK_TRANSFER";

interface OrderLine {
  id?: string;
  name?: string;
  product_name?: string;
  quantity?: number;
  price?: string | number;
  amount?: string | number;
}

interface InstallmentLine {
  id?: string;
  amount?: string | number;
  due_date?: string;
  status?: string;
}

interface TransactionLine {
  id?: string;
  reference?: string;
  amount?: string | number;
  status?: string;
  payment_method?: string;
  created_at?: string;
}

interface UserOrder {
  id: string;
  payment_mode: "FULL" | "INSTALLMENT" | string;
  status: OrderStatus | string;
  total_amount: string;
  deposit_amount?: string;
  remaining_balance?: string;
  external_email?: string;
  paid_amount?: number;
  payment_progress_percentage?: number;
  next_payment_amount?: number;
  next_payment_due_date?: string;
  next_installment?: InstallmentLine | null;
  can_pay?: boolean;
  can_pay_deposit?: boolean;
  can_pay_remaining_balance?: boolean;
  order_items?: OrderLine[];
  installments?: InstallmentLine[];
  transactions?: TransactionLine[];
  created_at?: string;
}

interface BankDetails {
  reference: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  amount: number;
}

const statusLabels: Record<OrderStatus, string> = {
  AWAITING_APPROVAL: "Pending admin approval",
  PENDING: "Approved, payment pending",
  PARTIALLY_PAID: "Partially paid",
  PAID: "Paid",
  REJECTED: "Rejected",
};

const statusClasses: Record<OrderStatus, string> = {
  AWAITING_APPROVAL: "border-yellow-500/25 bg-yellow-500/10 text-yellow-300",
  PENDING: "border-blue-500/25 bg-blue-500/10 text-blue-300",
  PARTIALLY_PAID: "border-purple-500/25 bg-purple-500/10 text-purple-300",
  PAID: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  REJECTED: "border-red-500/25 bg-red-500/10 text-red-300",
};

function fmtMoney(value?: string | number | null) {
  const numeric = Number(value ?? 0);
  return `N${numeric.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(value?: string | null) {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusLabel(status: string) {
  return statusLabels[status as OrderStatus] ?? status;
}

function getStatusClass(status: string) {
  return statusClasses[status as OrderStatus] ?? "border-white/10 bg-white/5 text-white/60";
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState("");
  const [ordersError, setOrdersError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile>({
    firstname: "",
    lastname: "",
    username: "",
    email: "",
  });
  const [success, setSuccess] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [bankDetailsByOrder, setBankDetailsByOrder] = useState<Record<string, BankDetails>>({});

  const fetchOrders = useCallback(async () => {
    const token = localStorage.getItem("userToken");
    if (!token) {
      window.location.href = "/auth/login";
      return;
    }

    setOrdersLoading(true);
    setOrdersError("");
    try {
      const res = await fetch(`${API_URL}/order/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const nextOrders = Array.isArray(data) ? data : data.orders ?? data.data ?? [];
        setOrders(nextOrders);
      } else {
        setOrdersError(data.message || "Failed to load orders");
      }
    } catch {
      setOrdersError("Connection error while loading orders");
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        window.location.href = "/auth/login";
        return;
      }

      const res = await fetch(`${API_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        const user = data.user ?? data;
        setProfile(user);
        setFormData(user);
        localStorage.setItem("userData", JSON.stringify(user));
      } else {
        setError(data.message || "Failed to load profile");
      }
    } catch {
      setError("Connection error");
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile().catch(() => undefined);
    fetchOrders().catch(() => undefined);
  }, [fetchOrders, fetchProfile]);

  const orderStats = useMemo(() => {
    const paid = orders.filter((order) => order.status === "PAID").length;
    const payable = orders.filter((order) => order.can_pay).length;
    const outstanding = orders.reduce((acc, order) => acc + Number(order.remaining_balance ?? 0), 0);
    return { paid, payable, outstanding };
  }, [orders]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("userToken");
      const res = await fetch(`${API_URL}/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        const user = data.user ?? data;
        setProfile(user);
        localStorage.setItem("userData", JSON.stringify(user));
        setSuccess("Profile updated successfully.");
        setIsEditing(false);
      } else {
        setError(data.message || "Update failed");
      }
    } catch {
      setError("Connection error");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("userToken");
      await fetch(`${API_URL}/user/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      console.error("Logout error");
    } finally {
      localStorage.removeItem("userToken");
      localStorage.removeItem("userData");
      window.location.href = "/";
    }
  };

  const initiatePayment = async (order: UserOrder, method: PaymentMethod) => {
    if (!order.can_pay) return;

    const token = localStorage.getItem("userToken");
    if (!token) {
      window.location.href = "/auth/login";
      return;
    }

    setPaymentError("");
    setProcessingPayment(`${order.id}:${method}`);
    try {
      const endpoint = method === "PAYSTACK" ? "/payment/paystack/initiate" : "/payment/manual/initiate";
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ order_id: order.id, installment_id: null }),
      });
      const data = await res.json();

      if (method === "PAYSTACK" && data.payment_link) {
        window.location.href = data.payment_link;
        return;
      }

      if (method === "BANK_TRANSFER" && data.reference) {
        setBankDetailsByOrder((current) => ({ ...current, [order.id]: data }));
        await fetchOrders();
        return;
      }

      setPaymentError(data.message || "Could not initiate payment.");
    } catch {
      setPaymentError("Connection error while initiating payment.");
    } finally {
      setProcessingPayment(null);
    }
  };

  if (profileLoading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07070a]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#07070a] text-white">
      <Navbar />
      <div className="max-w-6xl mx-auto pt-28 px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl mb-8"
        >
          <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-4xl font-bold">
              {profile?.firstname?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2">
                {profile?.firstname} {profile?.lastname}
              </h1>
              <p className="text-white/40">@{profile?.username}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all font-medium border border-white/10"
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
              <button
                onClick={handleLogout}
                className="px-5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-all font-medium border border-red-500/20"
              >
                Logout
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-green-500/15 border border-green-500/30 text-green-300 text-sm text-center">
              {success}
            </div>
          )}

          <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProfileField label="First Name" disabled={!isEditing} value={formData.firstname} onChange={(firstname) => setFormData({ ...formData, firstname })} />
            <ProfileField label="Last Name" disabled={!isEditing} value={formData.lastname} onChange={(lastname) => setFormData({ ...formData, lastname })} />
            <ProfileField label="Username" disabled={!isEditing} value={formData.username} onChange={(username) => setFormData({ ...formData, username })} />
            <ProfileField label="Email Address" type="email" disabled={!isEditing} value={formData.email} onChange={(email) => setFormData({ ...formData, email })} />

            {isEditing && (
              <div className="md:col-span-2 mt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 font-bold hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-70"
                >
                  {profileLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </form>
        </motion.div>

        <section>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-2xl font-bold">Orders Dashboard</h2>
              <p className="text-white/45 text-sm mt-1">Installment approvals, balances, payments, and history.</p>
            </div>
            <button
              onClick={() => fetchOrders()}
              className="w-fit rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5"
            >
              Refresh orders
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard label="Orders" value={orders.length} />
            <StatCard label="Can Pay Now" value={orderStats.payable} />
            <StatCard label="Outstanding" value={fmtMoney(orderStats.outstanding)} />
          </div>

          <AnimatePresence>
            {paymentError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-5 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-300"
              >
                {paymentError}
              </motion.div>
            )}
            {ordersError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-5 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-300"
              >
                {ordersError}
              </motion.div>
            )}
          </AnimatePresence>

          {ordersLoading ? (
            <div className="py-16 text-center text-white/45">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-white/45">
              No orders yet.
            </div>
          ) : (
            <div className="space-y-5">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  bankDetails={bankDetailsByOrder[order.id]}
                  processingPayment={processingPayment}
                  onPay={initiatePayment}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ProfileField({
  label,
  value,
  onChange,
  disabled,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/60 mb-2">{label}</label>
      <input
        type={type}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 transition-all"
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
      <p className="text-xl font-bold text-white tabular-nums">{value}</p>
      <p className="text-white/45 text-xs mt-1">{label}</p>
    </div>
  );
}

function OrderCard({
  order,
  bankDetails,
  processingPayment,
  onPay,
}: {
  order: UserOrder;
  bankDetails?: BankDetails;
  processingPayment: string | null;
  onPay: (order: UserOrder, method: PaymentMethod) => void;
}) {
  const isInstallment = order.payment_mode === "INSTALLMENT";
  const isAwaitingApproval = order.status === "AWAITING_APPROVAL";
  const isRejected = order.status === "REJECTED";
  const payLabel = order.can_pay_deposit
    ? "Pay deposit"
    : order.can_pay_remaining_balance
      ? "Pay next installment"
      : "Pay order";

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(order.status)}`}>
              {getStatusLabel(order.status)}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/60">
              {order.payment_mode}
            </span>
          </div>
          <p className="font-mono text-xs text-white/45 break-all">Order {order.id}</p>
          {isInstallment && order.external_email && (
            <p className="text-sm text-blue-300 mt-2 break-all">Cbrilliance email: {order.external_email}</p>
          )}
          {isRejected && (
            <p className="text-sm text-red-300 mt-2">The submitted Cbrilliance email could not be verified. Please use the correct email or open an account on cbrilliance.io.</p>
          )}
          {isAwaitingApproval && (
            <p className="text-sm text-yellow-200/80 mt-2">Payment is disabled until admin approval.</p>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 lg:w-[360px]">
          <MiniMetric label="Total" value={fmtMoney(order.total_amount)} />
          <MiniMetric label={isInstallment ? "Deposit" : "Paid"} value={fmtMoney(isInstallment ? order.deposit_amount : order.paid_amount)} />
          <MiniMetric label="Remaining" value={fmtMoney(order.remaining_balance)} />
          <MiniMetric label="Progress" value={`${Math.round(Number(order.payment_progress_percentage ?? 0))}%`} />
        </div>
      </div>

      {isInstallment && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <MiniMetric label="Next payment" value={fmtMoney(order.next_payment_amount)} />
          <MiniMetric label="Due date" value={fmtDate(order.next_payment_due_date)} />
          <MiniMetric label="Paid so far" value={fmtMoney(order.paid_amount)} />
        </div>
      )}

      {order.can_pay ? (
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <button
            onClick={() => onPay(order, "PAYSTACK")}
            disabled={processingPayment === `${order.id}:PAYSTACK`}
            className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {processingPayment === `${order.id}:PAYSTACK` ? "Starting..." : `${payLabel} with Paystack`}
          </button>
          <button
            onClick={() => onPay(order, "BANK_TRANSFER")}
            disabled={processingPayment === `${order.id}:BANK_TRANSFER`}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/75 hover:text-white disabled:opacity-60"
          >
            {processingPayment === `${order.id}:BANK_TRANSFER` ? "Loading..." : `${payLabel} by bank transfer`}
          </button>
        </div>
      ) : null}

      {bankDetails && (
        <div className="mb-5 rounded-2xl border border-blue-500/20 bg-blue-500/8 p-4">
          <p className="text-sm font-bold text-blue-200 mb-3">Bank transfer invoice</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <MiniMetric label="Bank" value={bankDetails.bank_name} />
            <MiniMetric label="Account name" value={bankDetails.account_name} />
            <MiniMetric label="Account number" value={bankDetails.account_number} />
            <MiniMetric label="Amount" value={fmtMoney(bankDetails.amount)} />
            <MiniMetric label="Reference" value={bankDetails.reference} />
          </div>
        </div>
      )}

      <OrderDetails order={order} />
    </motion.article>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3 min-w-0">
      <p className="text-white/40 text-[11px] mb-1">{label}</p>
      <p className="text-white font-semibold text-sm break-words tabular-nums">{value}</p>
    </div>
  );
}

function OrderDetails({ order }: { order: UserOrder }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <DetailList
        title="Products"
        emptyText="No product details"
        items={(order.order_items ?? []).map((item, index) => ({
          key: item.id ?? `${order.id}-item-${index}`,
          primary: item.name ?? item.product_name ?? "Product",
          secondary: `Qty ${item.quantity ?? 1}`,
          amount: item.amount ?? item.price,
        }))}
      />
      <DetailList
        title="Installments"
        emptyText="No installments yet"
        items={(order.installments ?? []).map((item, index) => ({
          key: item.id ?? `${order.id}-installment-${index}`,
          primary: fmtMoney(item.amount),
          secondary: `${item.status ?? "Scheduled"} - ${fmtDate(item.due_date)}`,
        }))}
      />
      <DetailList
        title="Transactions"
        emptyText="No transactions yet"
        items={(order.transactions ?? []).map((item, index) => ({
          key: item.id ?? item.reference ?? `${order.id}-transaction-${index}`,
          primary: fmtMoney(item.amount),
          secondary: `${item.payment_method ?? "Payment"} - ${item.status ?? "Pending"}`,
          amount: item.reference,
        }))}
      />
    </div>
  );
}

function DetailList({
  title,
  emptyText,
  items,
}: {
  title: string;
  emptyText: string;
  items: Array<{ key: string; primary: string; secondary?: string; amount?: string | number }>;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/10 p-4">
      <h3 className="text-sm font-bold mb-3">{title}</h3>
      {items.length === 0 ? (
        <p className="text-white/35 text-sm">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.key} className="border-b border-white/6 pb-3 last:border-0 last:pb-0">
              <p className="text-sm font-semibold text-white break-words">{item.primary}</p>
              {item.secondary && <p className="text-xs text-white/45 mt-1">{item.secondary}</p>}
              {item.amount !== undefined && <p className="text-xs text-blue-300 mt-1 break-all">{typeof item.amount === "number" ? fmtMoney(item.amount) : item.amount}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
