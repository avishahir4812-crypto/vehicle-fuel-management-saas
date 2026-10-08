export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Digits only; drops a leading Indian country code so 10-digit numbers match. */
export function normalizePhone(input: string): string {
  let digits = (input ?? "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

export function formatPhone(phone: string): string {
  return phone.length === 10 ? `${phone.slice(0, 5)} ${phone.slice(5)}` : phone;
}

/** Simple password strength for the signup meter. */
export function passwordStrength(value: string): {
  score: 0 | 1 | 2 | 3;
  hasLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
} {
  const hasLength = value.length >= 8;
  const hasLetter = /[A-Za-z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const score = ([hasLength, hasLetter, hasNumber].filter(Boolean).length) as 0 | 1 | 2 | 3;
  return { score, hasLength, hasLetter, hasNumber };
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const inrPrecise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const num = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });

export function formatINR(value: number | string, precise = false) {
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "₹0";
  return (precise ? inrPrecise : inr).format(n);
}

export function formatLiters(value: number | string) {
  const n = typeof value === "string" ? Number(value) : value;
  return `${num.format(n)} L`;
}

export function formatKm(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return `${new Intl.NumberFormat("en-IN").format(n)} km`;
}

export function formatDate(date: Date | string, locale = "en") {
  const d = typeof date === "string" ? new Date(date) : date;
  const tag = locale === "hi" ? "hi-IN" : locale === "gu" ? "gu-IN" : "en-IN";
  return d.toLocaleDateString(tag, { day: "numeric", month: "short", year: "numeric" });
}

export function formatTime(date: Date | string, locale = "en") {
  const d = typeof date === "string" ? new Date(date) : date;
  const tag = locale === "hi" ? "hi-IN" : locale === "gu" ? "gu-IN" : "en-IN";
  return d.toLocaleTimeString(tag, { hour: "2-digit", minute: "2-digit" });
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export const AVATAR_COLORS = [
  "bg-amber-500",
  "bg-emerald-600",
  "bg-sky-600",
  "bg-rose-500",
  "bg-violet-600",
  "bg-teal-600",
];

export function avatarColor(id: string) {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum = (sum + id.charCodeAt(i)) % 97;
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}
