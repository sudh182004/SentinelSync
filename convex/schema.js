import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    password: v.string(),
    role: v.union(v.literal("admin"), v.literal("guard")),
    expectedStartTime: v.optional(v.string()), // "09:00"
    expectedEndTime: v.optional(v.string()) // "17:00"
  }).index("by_email", ["email"]),
  
  shifts: defineTable({
    guardId: v.id("users"),
    date: v.string(), // "YYYY-MM-DD"
    checkInTime: v.optional(v.number()),
    checkOutTime: v.optional(v.number()),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("absent")),
    checkInLocation: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    checkOutLocation: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    isLate: v.optional(v.boolean()),
  }).index("by_guard", ["guardId"]).index("by_date", ["date"])
  .index("by_guard_date", ["guardId", "date"]),

  incidents: defineTable({
    guardId: v.id("users"),
    timestamp: v.number(),
    category: v.string(),
    description: v.string(),
    status: v.optional(v.union(v.literal("pending"), v.literal("resolved"))),
    location: v.optional(v.object({ lat: v.number(), lng: v.number() })),
  }).index("by_timestamp", ["timestamp"])
  .index("by_guard", ["guardId"]),
});
