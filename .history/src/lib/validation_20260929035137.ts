import { z } from "zod";
import { normalizePhone } from "./utils";

/* ---------- shared field rules ---------- */

export const phoneField = z
  .string()
  .trim()
  .transform(normalizePhone)
  .refine((v) => v.length >= 10 && v.length <= 15, { message: "invalid_phone" });

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .email()
  .max(120)
  .optional()
  .or(z.literal("").transform(() => undefined));

/** Simple, human password rule: 8+ chars with at least one letter and one number. */
export const passwordField = z
  .string()
  .min(8, "password_short")
  .max(100)
  .refine((v) => /[A-Za-z]/.test(v) && /[0-9]/.test(v), { message: "password_weak" });

export const joinKeyField = z
  .string()
  .trim()
  .toUpperCase()
  .length(5, "invalid_key")
  .regex(/^[A-Z0-9]{5}$/, "invalid_key");

/* ---------- auth ---------- */

export const ownerSignupSchema = z.object({
  role: z.literal("owner"),
  name: z.string().trim().min(2).max(80),
  phone: phoneField,
  email: emailField,
  password: passwordField,
  companyName: z.string().trim().min(2).max(80),
});

export const driverSignupSchema = z.object({
  role: z.literal("driver"),
  name: z.string().trim().min(2).max(80),
  phone: phoneField,
  email: emailField,
  password: passwordField,
  companyName: z.string().trim().min(2).max(80),
  joinKey: joinKeyField,
});

export const signupSchema = z.discriminatedUnion("role", [
  ownerSignupSchema,
  driverSignupSchema,
]);

/** Login accepts a phone number OR an email address. */
export const loginSchema = z.object({
  identifier: z.string().trim().min(3).max(120),
  password: z.string().min(1).max(100),
});

/* ---------- fleet ---------- */

export const vehicleSchema = z.object({
  name: z.string().trim().min(2).max(60),
  type: z.enum(["bolero", "truck", "pickup", "other"]),
  registrationNumber: z
    .string()
    .trim()
    .toUpperCase()
    .min(4)
    .max(16)
    .regex(/^[A-Z0-9 -]+$/, "invalid"),
  fuelType: z.enum(["diesel", "petrol", "cng"]).default("diesel"),
});

export const assignDriverSchema = z.object({
  driverId: z.string().uuid().nullable(),
});

export const fuelEntrySchema = z.object({
  vehicleId: z.string().uuid(),
  fuelRate: z.coerce.number().positive().max(10000),
  quantityLiters: z.coerce.number().positive().max(5000),
  totalAmount: z.coerce.number().positive().max(10000000),
  odometerKm: z.coerce.number().int().positive().max(10000000),
  // Photos are mandatory proof — empty strings are rejected.
  beforePhotoUrl: z.string().trim().min(1, "photo_required").max(500),
  afterPhotoUrl: z.string().trim().min(1, "photo_required").max(500),
  pumpPhotoUrl: z.string().max(500).nullable().optional(),
  note: z.string().trim().max(300).nullable().optional(),
});

export const createDriverSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: phoneField,
  email: emailField,
  password: passwordField,
});

/* ---------- misc ---------- */

export const messageSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
});

export const localeSchema = z.object({
  locale: z.enum(["en", "hi", "gu"]),
});
