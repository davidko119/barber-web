import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ─── Vytvorenie novej rezervácie (volá sa z formulára na webe) ─────────────
export const createBooking = mutation({
  args: {
    firstName: v.string(),
    lastName:  v.string(),
    email:     v.string(),
    phone:     v.optional(v.string()),
    service:   v.string(),
    date:      v.string(),
    notes:     v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("bookings", {
      ...args,
      status: "pending",
    });
    return id;
  },
});

// ─── Zoznam všetkých rezervácií — len pre admina ───────────────────────────
export const listBookings = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("bookings")
      .order("desc")
      .collect();
  },
});

// ─── Zmena statusu rezervácie ──────────────────────────────────────────────
export const updateStatus = mutation({
  args: {
    id:     v.id("bookings"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

// ─── Vymazanie rezervácie ──────────────────────────────────────────────────
export const deleteBooking = mutation({
  args: {
    id: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// ─── Rezervácie podľa dátumu ───────────────────────────────────────────────
export const getByDate = query({
  args: {
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bookings")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
  },
});
