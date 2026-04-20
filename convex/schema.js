import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    password: v.string(),
    role: v.union(v.literal("admin"), v.literal("guard")),
  }).index("by_email", ["email"]),
  
  shifts: defineTable({
    guardId: v.id("users"),
    date: v.string(), // "YYYY-MM-DD"
    checkInTime: v.optional(v.number()),
    checkOutTime: v.optional(v.number()),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("absent")),
  }).index("by_guard", ["guardId"]).index("by_date", ["date"])
  .index("by_guard_date", ["guardId", "date"]),

  incidents: defineTable({
    guardId: v.id("users"),
    timestamp: v.number(),
    category: v.string(),
    description: v.string(),
    status: v.optional(v.union(v.literal("pending"), v.literal("resolved"))),
  }).index("by_timestamp", ["timestamp"])
  .index("by_guard", ["guardId"]),
});
