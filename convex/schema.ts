import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  bookings: defineTable({
    // Osobné údaje
    firstName: v.string(),
    lastName:  v.string(),
    email:     v.string(),
    phone:     v.optional(v.string()),

    // Rezervácia
    service:   v.string(),   // "haircut" | "skincare" | "body" | "shampoo"
    date:      v.string(),   // ISO date string "YYYY-MM-DD"
    notes:     v.optional(v.string()),

    // Stav
    status:    v.string(),   // "pending" | "confirmed" | "cancelled"
  })
    .index("by_date",   ["date"])
    .index("by_status", ["status"]),

  site_content: defineTable({
    key:   v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),

  gallery: defineTable({
    url:   v.string(),
    order: v.number(),
  }).index("by_order", ["order"]),
});
