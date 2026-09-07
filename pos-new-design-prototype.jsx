import React, { useState, useMemo, useEffect } from "react";
import {
  Menu,
  ChevronDown,
  Store,
  Truck,
  CalendarClock,
  Minus,
  Plus,
  Trash2,
  X,
  Banknote,
  CreditCard,
  Clock3,
  CheckCircle2,
  ShoppingCart,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/* Design tokens                                                          */
/* ---------------------------------------------------------------------- */

const C = {
  bg: "#0c0c0d",
  surface: "#17181a",
  surface2: "#1d1f22",
  surface3: "#232529",
  border: "#2a2c30",
  borderLight: "#38393f",
  text: "#f2efe9",
  textDim: "#97999f",
  textFaint: "#5f6167",
  accent: "#cf8a3d",
  accentDark: "#b8752f",
  accentBg: "rgba(207,138,63,0.14)",
  accentBorder: "rgba(207,138,63,0.45)",
  success: "#4f9d6d",
  successBg: "rgba(79,157,109,0.14)",
  successBorder: "rgba(79,157,109,0.45)",
  danger: "#c1554e",
  dangerBg: "rgba(193,85,78,0.12)",
  dangerBorder: "rgba(193,85,78,0.4)",
  info: "#5f8fb4",
  infoBg: "rgba(95,143,180,0.14)",
};

const FONT_SANS = "'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, sans-serif";
const FONT_MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace";

/* ---------------------------------------------------------------------- */
/* Sample data                                                            */
/* ---------------------------------------------------------------------- */

const CATEGORIES = [
  { key: "all", label: "الكل" },
  { key: "cement", label: "أسمنت وخرسانة" },
  { key: "iron", label: "حديد ومعادن" },
  { key: "tiles", label: "سيراميك وبلاط" },
  { key: "paint", label: "دهانات" },
  { key: "plumbing", label: "سباكة" },
  { key: "tools", label: "عدد يدوية" },
  { key: "adhesive", label: "مواد لاصقة" },
  { key: "safety", label: "معدات السلامة" },
];

const PRODUCTS = [
  { id: 1, name: "اسمنت بورتلاندي - كيس 50 كغم", price: 45, cat: "cement" },
  { id: 2, name: "رمل بناء - المتر المكعب", price: 60, cat: "cement" },
  { id: 3, name: "بلوك خرساني 8 سم", price: 3.5, cat: "cement" },
  { id: 4, name: "حصى مدرج - المتر المكعب", price: 55, cat: "cement" },
  { id: 5, name: "حديد تسليح 12 مم", price: 120, cat: "iron" },
  { id: 6, name: "حديد تسليح 16 مم", price: 165, cat: "iron" },
  { id: 7, name: "سلك ربط حديد", price: 15, cat: "iron" },
  { id: 8, name: "مسامير بناء 4 بوصة - كغم", price: 6, cat: "iron" },
  { id: 9, name: "بلاط سيراميك 60×60 - م²", price: 28, cat: "tiles" },
  { id: 10, name: "بلاط أرضيات 30×30 - م²", price: 18, cat: "tiles" },
  { id: 11, name: "كاشي حائط مطبخ - م²", price: 22, cat: "tiles" },
  { id: 12, name: "دهان بلاستيك أبيض 18 لتر", price: 85, cat: "paint" },
  { id: 13, name: "دهان زيتي أزرق 4 لتر", price: 40, cat: "paint" },
  { id: 14, name: "برايمر عازل 18 لتر", price: 70, cat: "paint" },
  { id: 15, name: "أنبوب PVC 4 بوصة - متر", price: 12, cat: "plumbing" },
  { id: 16, name: "صنبور مياه نحاس", price: 35, cat: "plumbing" },
  { id: 17, name: "خزان مياه بلاستيك 500 لتر", price: 210, cat: "plumbing" },
  { id: 18, name: "مفتاح إنجليزي 10 بوصة", price: 25, cat: "tools" },
  { id: 19, name: "شريط قياس 5 متر", price: 18, cat: "tools" },
  { id: 20, name: "مطرقة بناء", price: 20, cat: "tools" },
  { id: 21, name: "غراء بلاط 25 كغم", price: 22, cat: "adhesive" },
  { id: 22, name: "معجون حائط 20 كغم", price: 30, cat: "adhesive" },
  { id: 23, name: "سيليكون لاصق شفاف", price: 9, cat: "adhesive" },
  { id: 24, name: "خوذة سلامة", price: 15, cat: "safety" },
  { id: 25, name: "قفازات عمل جلد", price: 10, cat: "safety" },
  { id: 26, name: "نظارات حماية", price: 8, cat: "safety" },
];

const CUSTOMERS = ["زائر", "شركة البناء الحديث", "مقاولات التعمير", "أحمد الشريف"];
const ORDER_TYPES = [
  { key: "pickup", label: "استلام فوري", icon: Store },
  { key: "delivery", label: "توصيل", icon: Truck },
  { key: "reserve", label: "حجز مسبق", icon: CalendarClock },
];

/* ---------------------------------------------------------------------- */
/* Small shared pieces                                                    */
/* ---------------------------------------------------------------------- */

function Money({ value, size = 16, weight = 600, color }) {
  return (
    <span
      style={{
        fontFamily: FONT_MONO,
        fontVariantNumeric: "tabular-nums",
        fontSize: size,
        fontWeight: weight,
        color: color || C.text,
        whiteSpace: "nowrap",
      }}
    >
      <bdi dir="ltr">{value.toFixed(2)}</bdi>
      <span style={{ fontFamily: FONT_SANS, fontSize: "0.68em", opacity: 0.75, marginInlineStart: 4 }}>
        د.ل
      </span>
    </span>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 rounded-full px-4 font-medium transition-colors"
      style={{
        height: 44,
        fontFamily: FONT_SANS,
        fontSize: 14.5,
        color: active ? C.bg : C.text,
        background: active ? C.accent : C.surface2,
        border: `1px solid ${active ? C.accent : C.border}`,
      }}
    >
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------------- */
/* Header                                                                 */
/* ---------------------------------------------------------------------- */

function CustomerPicker({ customer, setCustomer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full px-4 transition-colors"
        style={{
          height: 44,
          fontFamily: FONT_SANS,
          fontSize: 14.5,
          color: C.text,
          background: C.surface2,
          border: `1px solid ${C.border}`,
        }}
      >
        <span style={{ color: C.textDim }}>العميل:</span>
        <span className="font-medium">{customer}</span>
        <ChevronDown size={16} color={C.textDim} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            className="absolute top-full z-40 mt-2 w-64 overflow-hidden rounded-2xl p-1.5 shadow-2xl"
            style={{ background: C.surface3, border: `1px solid ${C.borderLight}`, insetInlineEnd: 0 }}
          >
            {CUSTOMERS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCustomer(c);
                  setOpen(false);
                }}
                className="block w-full rounded-xl px-3 py-2.5 text-start transition-colors"
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: 14.5,
                  color: c === customer ? C.accent : C.text,
                  background: c === customer ? C.accentBg : "transparent",
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function OrderTypeControl({ orderType, setOrderType }) {
  return (
    <div
      className="flex items-center gap-1 rounded-full p-1"
      style={{ background: C.surface2, border: `1px solid ${C.border}` }}
    >
      {ORDER_TYPES.map((t) => {
        const Icon = t.icon;
        const active = orderType === t.key;
        return (
          <button
            key={t.key}
            onClick={() => setOrderType(t.key)}
            className="flex items-center gap-1.5 rounded-full px-3.5 transition-colors"
            style={{
              height: 36,
              fontFamily: FONT_SANS,
              fontSize: 13.5,
              fontWeight: 500,
              color: active ? C.bg : C.textDim,
              background: active ? C.accent : "transparent",
            }}
          >
            <Icon size={15} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function Header({ customer, setCustomer, orderType, setOrderType }) {
  return (
    <div
      className="flex items-center justify-between px-5"
      style={{ height: 68, background: C.surface, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}
    >
      <div className="flex items-center gap-3">
        <button
          className="flex items-center justify-center rounded-xl transition-colors"
          style={{ width: 40, height: 40, background: C.surface2, border: `1px solid ${C.border}` }}
        >
          <Menu size={19} color={C.textDim} />
        </button>
        <div>
          <div style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 700, color: C.text }}>
            متجر الوفاء لمواد البناء
          </div>
          <div style={{ fontFamily: FONT_SANS, fontSize: 12, color: C.textFaint }}>نقطة البيع</div>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <CustomerPicker customer={customer} setCustomer={setCustomer} />
        <OrderTypeControl orderType={orderType} setOrderType={setOrderType} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Product browsing panel                                                 */
/* ---------------------------------------------------------------------- */

function ProductCard({ product, onAdd }) {
  return (
    <button
      onClick={() => onAdd(product)}
      className="flex flex-col items-start rounded-2xl p-3.5 text-start transition-transform active:scale-[0.97]"
      style={{ background: C.surface, border: `1px solid ${C.border}`, minHeight: 96 }}
    >
      <Money value={product.price} size={19} weight={700} color={C.accent} />
      <span
        className="mt-1.5 leading-snug"
        style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.textDim }}
      >
        {product.name}
      </span>
    </button>
  );
}

function ProductPanel({ category, setCategory, products, onAdd }) {
  return (
    <div className="flex h-full flex-col" style={{ background: C.bg }}>
      <div className="flex gap-2 overflow-x-auto px-5 pb-3 pt-4" style={{ scrollbarWidth: "none" }}>
        {CATEGORIES.map((c) => (
          <Chip key={c.key} active={category === c.key} onClick={() => setCategory(c.key)}>
            {c.label}
          </Chip>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-5">
        <div className="grid grid-cols-4 gap-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onAdd={onAdd} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Cart panel                                                             */
/* ---------------------------------------------------------------------- */

function Stepper({ qty, onInc, onDec }) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-full px-1"
      style={{ background: C.surface2, border: `1px solid ${C.border}`, height: 40 }}
    >
      <button
        onClick={onDec}
        className="flex items-center justify-center rounded-full"
        style={{ width: 32, height: 32, color: C.text }}
      >
        <Minus size={15} />
      </button>
      <span
        style={{ fontFamily: FONT_MONO, fontSize: 15, fontWeight: 600, color: C.text, minWidth: 16, textAlign: "center" }}
      >
        <bdi dir="ltr">{qty}</bdi>
      </span>
      <button
        onClick={onInc}
        className="flex items-center justify-center rounded-full"
        style={{ width: 32, height: 32, background: C.accentBg, color: C.accent }}
      >
        <Plus size={15} />
      </button>
    </div>
  );
}

function CartLine({ item, onInc, onDec, onRemove }) {
  return (
    <div className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
      <button
        onClick={onRemove}
        className="flex items-center justify-center rounded-lg"
        style={{ width: 32, height: 32, color: C.danger, flexShrink: 0 }}
        aria-label="إزالة الصنف"
      >
        <Trash2 size={17} />
      </button>
      <div className="min-w-0 flex-1">
        <div
          className="truncate"
          style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 500, color: C.text }}
        >
          {item.name}
        </div>
        <div className="mt-0.5">
          <Money value={item.price} size={12.5} weight={500} color={C.textFaint} />
        </div>
      </div>
      <Stepper qty={item.qty} onInc={onInc} onDec={onDec} />
      <div style={{ width: 78, textAlign: "end", flexShrink: 0 }}>
        <Money value={item.price * item.qty} size={14.5} weight={700} />
      </div>
    </div>
  );
}

function CartPanel({ cart, onInc, onDec, onRemove, total, onOpenPayment }) {
  return (
    <div
      className="flex h-full flex-col"
      style={{ background: C.surface, borderInlineStart: `1px solid ${C.border}` }}
    >
      <div className="px-5 pb-2 pt-4">
        <span style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 700, color: C.text }}>
          السلة
        </span>
        {cart.length > 0 && (
          <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.textFaint }}> ({cart.length})</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5">
        {cart.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 pb-16 text-center">
            <ShoppingCart size={30} color={C.textFaint} />
            <span style={{ fontFamily: FONT_SANS, fontSize: 13.5, color: C.textFaint }}>
              السلة فارغة — اختر صنفًا من القائمة للبدء
            </span>
          </div>
        ) : (
          cart.map((item) => (
            <CartLine
              key={item.id}
              item={item}
              onInc={() => onInc(item.id)}
              onDec={() => onDec(item.id)}
              onRemove={() => onRemove(item.id)}
            />
          ))
        )}
      </div>

      <div className="px-5 pb-5 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="mb-3 flex items-center justify-between">
          <span style={{ fontFamily: FONT_SANS, fontSize: 14, color: C.textDim }}>الإجمالي</span>
          <Money value={total} size={20} weight={700} color={C.info} />
        </div>
        <button
          onClick={onOpenPayment}
          disabled={cart.length === 0}
          className="flex w-full items-center justify-between rounded-2xl px-6 transition-opacity"
          style={{
            height: 64,
            background: cart.length === 0 ? C.surface2 : C.accent,
            opacity: cart.length === 0 ? 0.5 : 1,
          }}
        >
          <span style={{ fontFamily: FONT_SANS, fontSize: 18, fontWeight: 700, color: cart.length === 0 ? C.textFaint : C.bg }}>
            إتمام الدفع
          </span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 18, fontWeight: 700, color: cart.length === 0 ? C.textFaint : C.bg }}>
            <bdi dir="ltr">{total.toFixed(2)}</bdi>
          </span>
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Payment panel                                                          */
/* ---------------------------------------------------------------------- */

const PAYMENT_METHODS = [
  { key: "cash", label: "نقداً", icon: Banknote },
  { key: "card", label: "بطاقة مصرفية", icon: CreditCard },
  { key: "credit", label: "آجل", icon: Clock3 },
];

function PaymentTile({ method, active, onClick }) {
  const Icon = method.icon;
  return (
    <button
      onClick={onClick}
      className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl transition-colors"
      style={{
        height: 72,
        background: active ? C.accentBg : C.surface2,
        border: `1px solid ${active ? C.accentBorder : C.border}`,
      }}
    >
      <Icon size={20} color={active ? C.accent : C.textDim} />
      <span
        style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 500, color: active ? C.accent : C.textDim }}
      >
        {method.label}
      </span>
    </button>
  );
}

function QuickAmount({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-1 items-center justify-center rounded-xl px-2 font-semibold transition-colors"
      style={{
        height: 48,
        fontFamily: FONT_MONO,
        fontSize: 14.5,
        color: C.text,
        background: C.surface2,
        border: `1px solid ${C.border}`,
      }}
    >
      {label}
    </button>
  );
}

function NumKey({ label, onClick, muted }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center rounded-2xl transition-colors"
      style={{
        height: 64,
        fontFamily: FONT_MONO,
        fontSize: 22,
        fontWeight: 600,
        color: muted ? C.textDim : C.text,
        background: C.surface2,
        border: `1px solid ${C.border}`,
      }}
    >
      {label}
    </button>
  );
}

function SummaryRow({ label, value, color, size = 15 }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span style={{ fontFamily: FONT_SANS, fontSize: 13.5, color: C.textDim }}>{label}</span>
      <Money value={value} size={size} weight={600} color={color || C.text} />
    </div>
  );
}

function PaymentPanel({ total, onClose, onComplete }) {
  const [method, setMethod] = useState("cash");
  const [tendered, setTendered] = useState("");
  const [confirmingPartial, setConfirmingPartial] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | success | saved

  const amount = tendered === "" ? 0 : parseFloat(tendered) || 0;
  const change = Math.max(0, amount - total);
  const remaining = Math.max(0, total - amount);
  const isFull = amount > 0 && amount >= total;

  const roundUp = (n, step) => Math.ceil(n / step) * step;
  const quickAmounts = useMemo(() => {
    const opts = [{ label: "المبلغ بالضبط", value: total }];
    const r10 = roundUp(total, 10);
    const r50 = roundUp(total, 50);
    if (r10 > total) opts.push({ label: r10.toFixed(0), value: r10 });
    if (r50 > total && r50 !== r10) opts.push({ label: r50.toFixed(0), value: r50 });
    return opts.slice(0, 3);
  }, [total]);

  function pressDigit(d) {
    setConfirmingPartial(false);
    setTendered((prev) => {
      if (d === ".") {
        if (prev.includes(".")) return prev;
        return prev === "" ? "0." : prev + ".";
      }
      if (prev === "0") return String(d);
      return prev + String(d);
    });
  }
  function backspace() {
    setConfirmingPartial(false);
    setTendered((prev) => prev.slice(0, -1));
  }
  function setQuick(v) {
    setConfirmingPartial(false);
    setTendered(String(v));
  }

  function handlePrimary() {
    if (amount <= 0) return;
    if (isFull) {
      setStatus("success");
      setTimeout(() => onComplete(), 1100);
    } else if (!confirmingPartial) {
      setConfirmingPartial(true);
    } else {
      setStatus("saved");
      setTimeout(() => onComplete(), 1100);
    }
  }

  useEffect(() => {
    setConfirmingPartial(false);
  }, [method]);

  if (status === "success" || status === "saved") {
    const success = status === "success";
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3" style={{ background: C.surface2 }}>
        <div
          className="flex items-center justify-center rounded-full"
          style={{ width: 64, height: 64, background: success ? C.successBg : C.infoBg }}
        >
          <CheckCircle2 size={34} color={success ? C.success : C.info} />
        </div>
        <span style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 700, color: C.text }}>
          {success ? "تم الدفع بنجاح" : "تم حفظ الطلب كغير مكتمل"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" style={{ background: C.surface2 }}>
      <div
        className="flex items-center justify-between px-5"
        style={{ height: 60, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}
      >
        <span style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 700, color: C.text }}>الدفع</span>
        <button
          onClick={onClose}
          className="flex items-center justify-center rounded-xl"
          style={{ width: 40, height: 40, background: C.surface3, border: `1px solid ${C.border}` }}
        >
          <X size={18} color={C.textDim} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="flex gap-2.5">
          {PAYMENT_METHODS.map((m) => (
            <PaymentTile key={m.key} method={m} active={method === m.key} onClick={() => setMethod(m.key)} />
          ))}
        </div>

        <div
          className="mt-4 flex items-center justify-between rounded-2xl px-4"
          style={{ height: 60, background: C.surface3, border: `1px solid ${C.border}` }}
        >
          <span style={{ fontFamily: FONT_SANS, fontSize: 13.5, color: C.textDim }}>المبلغ المستلم</span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 700, color: C.text }}>
            <bdi dir="ltr">{amount.toFixed(2)}</bdi>
          </span>
        </div>

        <div className="mt-3 flex gap-2.5">
          {quickAmounts.map((q) => (
            <QuickAmount key={q.label} label={q.label} onClick={() => setQuick(q.value)} />
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {["7", "8", "9", "4", "5", "6", "1", "2", "3"].map((d) => (
            <NumKey key={d} label={d} onClick={() => pressDigit(d)} />
          ))}
          <NumKey label="." onClick={() => pressDigit(".")} muted />
          <NumKey label="0" onClick={() => pressDigit("0")} />
          <NumKey label="⌫" onClick={backspace} muted />
        </div>

        <div className="mt-5" style={{ borderTop: `1px solid ${C.border}` }}>
          <div className="pt-3">
            <SummaryRow label="الإجمالي" value={total} color={C.info} size={16} />
            <SummaryRow label="الخصم" value={0} color={C.textDim} />
            <SummaryRow label="المدفوع" value={amount} />
            {isFull ? (
              <SummaryRow label="الباقي" value={change} color={C.success} />
            ) : (
              <SummaryRow label="المتبقي" value={remaining} color={C.accent} />
            )}
          </div>
        </div>

        {confirmingPartial && !isFull && (
          <div
            className="mt-3 rounded-2xl p-3.5"
            style={{ background: C.accentBg, border: `1px solid ${C.accentBorder}` }}
          >
            <p style={{ fontFamily: FONT_SANS, fontSize: 13.5, color: C.text, lineHeight: 1.6 }}>
              سيتم حفظ الطلب مع مبلغ متبقٍ قدره{" "}
              <span style={{ fontFamily: FONT_MONO, fontWeight: 700 }}>
                <bdi dir="ltr">{remaining.toFixed(2)}</bdi>
              </span>{" "}
              د.ل. هل تريد المتابعة؟
            </p>
            <button
              onClick={() => setConfirmingPartial(false)}
              className="mt-2 text-start"
              style={{ fontFamily: FONT_SANS, fontSize: 13, color: C.textDim }}
            >
              تراجع
            </button>
          </div>
        )}
      </div>

      <div className="px-5 pb-5 pt-3" style={{ flexShrink: 0 }}>
        <button
          onClick={handlePrimary}
          disabled={amount <= 0}
          className="flex w-full items-center justify-center rounded-2xl transition-opacity"
          style={{
            height: 64,
            background: amount <= 0 ? C.surface3 : isFull ? C.success : confirmingPartial ? C.accentDark : C.surface3,
            border: amount <= 0 || (!isFull && !confirmingPartial) ? `1px solid ${C.border}` : "none",
            opacity: amount <= 0 ? 0.55 : 1,
          }}
        >
          <span
            style={{
              fontFamily: FONT_SANS,
              fontSize: 17,
              fontWeight: 700,
              color: amount <= 0 ? C.textFaint : isFull || confirmingPartial ? C.bg : C.text,
            }}
          >
            {isFull ? "تأكيد الدفع" : confirmingPartial ? "تأكيد الحفظ" : "حفظ كطلب غير مكتمل"}
          </span>
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* App                                                                    */
/* ---------------------------------------------------------------------- */

export default function POSApp() {
  const [category, setCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState("زائر");
  const [orderType, setOrderType] = useState("pickup");
  const [showPayment, setShowPayment] = useState(false);

  const filteredProducts = useMemo(
    () => (category === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.cat === category)),
    [category]
  );

  const total = useMemo(() => cart.reduce((sum, i) => sum + i.price * i.qty, 0), [cart]);

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }
  function incQty(id) {
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i)));
  }
  function decQty(id) {
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, i.qty - 1) } : i))
    );
  }
  function removeItem(id) {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }
  function completePayment() {
    setShowPayment(false);
    setCart([]);
  }

  return (
    <div
      dir="rtl"
      className="relative flex h-screen w-full flex-col overflow-hidden"
      style={{ background: C.bg, fontFamily: FONT_SANS }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600;700&display=swap');
        * { box-sizing: border-box; }
        button { cursor: pointer; }
        button:focus-visible { outline: 2px solid ${C.accent}; outline-offset: 2px; }
      `}</style>

      <Header customer={customer} setCustomer={setCustomer} orderType={orderType} setOrderType={setOrderType} />

      <div className="flex min-h-0 flex-1">
        <div style={{ flex: "0 0 60%", minWidth: 0 }}>
          <ProductPanel category={category} setCategory={setCategory} products={filteredProducts} onAdd={addToCart} />
        </div>
        <div style={{ flex: "0 0 40%", minWidth: 0 }}>
          <CartPanel
            cart={cart}
            onInc={incQty}
            onDec={decQty}
            onRemove={removeItem}
            total={total}
            onOpenPayment={() => setShowPayment(true)}
          />
        </div>
      </div>

      {showPayment && (
        <div className="absolute inset-0 z-50 flex">
          <div
            className="flex-1"
            style={{ background: "rgba(0,0,0,0.55)" }}
            onClick={() => setShowPayment(false)}
          />
          <div
            className="h-full shadow-2xl"
            style={{ width: "42%", minWidth: 400, animation: "slideIn 0.22s ease-out" }}
          >
            <style>{`
              @keyframes slideIn {
                from { transform: translateX(-16px); opacity: 0.4; }
                to { transform: translateX(0); opacity: 1; }
              }
            `}</style>
            <PaymentPanel total={total} onClose={() => setShowPayment(false)} onComplete={completePayment} />
          </div>
        </div>
      )}
    </div>
  );
}
