import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ─── Site Content ──────────────────────────────

export const getContent = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("site_content").collect();
  },
});

export const updateContent = mutation({
  args: {
    key:   v.string(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("site_content")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value });
    } else {
      await ctx.db.insert("site_content", { key: args.key, value: args.value });
    }
  },
});

// ─── Gallery ───────────────────────────────────

export const getGallery = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("gallery").withIndex("by_order").collect();
  },
});

export const addGalleryImage = mutation({
  args: {
    url:   v.string(),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const images = await ctx.db.query("gallery").collect();
    const order = args.order ?? images.length;
    return await ctx.db.insert("gallery", { url: args.url, order });
  },
});

export const removeGalleryImage = mutation({
  args: { id: v.id("gallery") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
