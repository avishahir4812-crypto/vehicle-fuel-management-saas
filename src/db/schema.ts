import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  timestamp,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["owner", "driver"]);
export const vehicleTypeEnum = pgEnum("vehicle_type", [
  "bolero",
  "truck",
  "pickup",
  "other",
]);

/** A tenant. Owners create one at signup; drivers join it with name + key. */
export const planEnum = pgEnum("plan", ["trial", "monthly", "quarterly", "yearly", "free"]);
export const subStatusEnum = pgEnum("sub_status", ["trialing", "active", "expired"]);

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    /** 5-character mixed key shared with drivers. */
    joinKey: text("join_key").notNull(),
    /** Billing */
    plan: planEnum("plan").notNull().default("trial"),
    subStatus: subStatusEnum("sub_status").notNull().default("trialing"),
    /** Trial or paid period end. Null = never expires (free/demo accounts). */
    periodEnd: timestamp("period_end", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("companies_join_key_unique").on(t.joinKey),
    index("companies_name_idx").on(t.name),
  ]
);

/** Immutable record of every subscription purchase. */
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    plan: planEnum("plan").notNull(),
    /** Amount actually charged, in paise. */
    amountPaise: integer("amount_paise").notNull(),
    months: integer("months").notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    reference: text("reference").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("payments_company_idx").on(t.companyId, t.createdAt)]
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    /** Primary identifier — digits only. */
    phone: text("phone").notNull(),
    /** Optional secondary identifier. */
    email: text("email"),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    locale: text("locale").notNull().default("en"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("users_phone_unique").on(t.phone),
    uniqueIndex("users_email_unique").on(t.email),
    index("users_company_idx").on(t.companyId),
  ]
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tokenHash: text("token_hash").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("sessions_token_hash_unique").on(t.tokenHash),
    index("sessions_user_idx").on(t.userId),
  ]
);

export const vehicles = pgTable(
  "vehicles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    driverId: uuid("driver_id").references(() => users.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    type: vehicleTypeEnum("type").notNull(),
    registrationNumber: text("registration_number").notNull(),
    fuelType: text("fuel_type").notNull().default("diesel"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("vehicles_reg_unique").on(t.registrationNumber),
    index("vehicles_company_idx").on(t.companyId),
    index("vehicles_driver_idx").on(t.driverId),
  ]
);

export const fuelEntries = pgTable(
  "fuel_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    driverId: uuid("driver_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fuelRate: numeric("fuel_rate", { precision: 10, scale: 2 }).notNull(),
    quantityLiters: numeric("quantity_liters", { precision: 10, scale: 2 }).notNull(),
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
    odometerKm: integer("odometer_km").notNull(),
    beforePhotoUrl: text("before_photo_url").notNull(),
    afterPhotoUrl: text("after_photo_url").notNull(),
    pumpPhotoUrl: text("pump_photo_url"),
    note: text("note"),
    /** Comma-separated anomaly codes — entry is shown in red when set. */
    anomaly: text("anomaly"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("fuel_vehicle_idx").on(t.vehicleId, t.createdAt),
    index("fuel_company_idx").on(t.companyId, t.createdAt),
    index("fuel_driver_idx").on(t.driverId, t.createdAt),
  ]
);

/** Exactly one combined thread per company — owner + every driver. */
export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("conversations_company_unique").on(t.companyId)]
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_conversation_idx").on(t.conversationId, t.createdAt)]
);

export const conversationReads = pgTable(
  "conversation_reads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastReadAt: timestamp("last_read_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("conversation_reads_unique").on(t.conversationId, t.userId)]
);

/** One-time OTP for self-service password reset. */
export const passwordResets = pgTable(
  "password_resets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    otpHash: text("otp_hash").notNull(),
    attempts: integer("attempts").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("password_resets_user_idx").on(t.userId)]
);

export type Company = typeof companies.$inferSelect;
export type User = typeof users.$inferSelect;
export type Vehicle = typeof vehicles.$inferSelect;
export type FuelEntry = typeof fuelEntries.$inferSelect;
export type Message = typeof messages.$inferSelect;
