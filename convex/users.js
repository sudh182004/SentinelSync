import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    role: v.union(v.literal("admin"), v.literal("guard")),
  },
  handler: async (ctx, args) => {
    // Check if email already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("Email already in use");
    }

    const userData = {
      name: args.name,
      email: args.email,
      password: args.password,
      role: args.role,
    };

    if (args.role === 'guard') {
      userData.expectedStartTime = "09:00"; // 9 AM sharp
      userData.expectedEndTime = "17:00";   // 5 PM
    }

    return await ctx.db.insert("users", userData);
  },
});

export const loginMutation = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
      
    if (!user || user.password !== args.password) {
      return null;
    }
    
    return user;
  },
});

export const getById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getAllGuards = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.filter(u => u.role === "guard");
  }
});

export const updateSchedule = mutation({
  args: {
    userId: v.id("users"),
    expectedStartTime: v.string(),
    expectedEndTime: v.string()
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.userId, {
      expectedStartTime: args.expectedStartTime,
      expectedEndTime: args.expectedEndTime
    });
  }
});
