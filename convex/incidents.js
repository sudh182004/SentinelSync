import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const reportIncident = mutation({
  args: {
    guardId: v.id("users"),
    category: v.string(), // "theft", "violence", "medical", "other"
    description: v.string(),
    location: v.optional(v.object({ lat: v.number(), lng: v.number() }))
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("incidents", {
      guardId: args.guardId,
      timestamp: Date.now(),
      category: args.category,
      description: args.description,
      status: "pending",
      location: args.location
    });
  }
});

export const updateIncidentStatus = mutation({
  args: {
    incidentId: v.id("incidents"),
    status: v.union(v.literal("pending"), v.literal("resolved"))
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.incidentId, {
      status: args.status
    });
  }
});

export const getIncidents = query({
  handler: async (ctx) => {
    const incidents = await ctx.db.query("incidents").order("desc").take(50);
    const users = await ctx.db.query("users").collect();
    const userMap = new Map(users.map(u => [u._id, u]));

    return incidents.map(inc => ({
      ...inc,
      guardName: userMap.get(inc.guardId)?.name || "Unknown"
    }));
  }
});

export const getIncidentsByGuard = query({
  args: { guardId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("incidents")
      .withIndex("by_guard", (q) => q.eq("guardId", args.guardId))
      .order("desc")
      .take(20);
  }
});
