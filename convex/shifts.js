import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getTodayDateString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const checkIn = mutation({
  args: { guardId: v.id("users") },
  handler: async (ctx, args) => {
    const today = getTodayDateString();
    
    const existing = await ctx.db
      .query("shifts")
      .withIndex("by_guard_date", (q) => q.eq("guardId", args.guardId).eq("date", today))
      .first();

    if (existing) {
      throw new Error("Already checked in today.");
    }

    return await ctx.db.insert("shifts", {
      guardId: args.guardId,
      date: today,
      checkInTime: Date.now(),
      status: "active"
    });
  }
});

export const checkOut = mutation({
  args: { guardId: v.id("users") },
  handler: async (ctx, args) => {
    const today = getTodayDateString();
    
    const existing = await ctx.db
      .query("shifts")
      .withIndex("by_guard_date", (q) => q.eq("guardId", args.guardId).eq("date", today))
      .first();

    if (!existing) {
      throw new Error("Cannot check out without checking in first.");
    }

    if (existing.checkOutTime) {
      throw new Error("Already checked out today.");
    }

    return await ctx.db.patch(existing._id, {
      checkOutTime: Date.now(),
      status: "completed"
    });
  }
});

export const getGuardTodayShift = query({
  args: { guardId: v.id("users") },
  handler: async (ctx, args) => {
    const today = getTodayDateString();
    return await ctx.db
      .query("shifts")
      .withIndex("by_guard_date", (q) => q.eq("guardId", args.guardId).eq("date", today))
      .first();
  }
});

export const getGuardRecentShifts = query({
  args: { guardId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("shifts")
      .withIndex("by_guard", (q) => q.eq("guardId", args.guardId))
      .order("desc")
      .take(10);
  }
});

export const getAdminStats = query({
  handler: async (ctx) => {
    const today = getTodayDateString();
    const users = await ctx.db.query("users").collect();
    const guards = users.filter((u) => u.role === "guard");
    
    const todayShifts = await ctx.db
      .query("shifts")
      .withIndex("by_date", (q) => q.eq("date", today))
      .collect();

    let totalGuards = guards.length;
    let presentToday = 0;
    let completedToday = 0;
    let activeToday = 0;
    let absentOrMissedToday = 0;

    const shiftMap = new Map(todayShifts.map(s => [s.guardId, s]));

    guards.forEach(guard => {
      const shift = shiftMap.get(guard._id);
      if (!shift) {
        absentOrMissedToday++;
      } else {
        presentToday++;
        if (shift.status === "active") activeToday++;
        if (shift.status === "completed") completedToday++;
      }
    });

    return {
      totalGuards,
      presentToday,
      activeToday,
      completedToday,
      absentOrMissedToday
    };
  }
});

export const getAllShiftsWithUsers = query({
  handler: async (ctx) => {
    const shifts = await ctx.db.query("shifts").order("desc").take(50);
    const users = await ctx.db.query("users").collect();
    const userMap = new Map(users.map(u => [u._id, u]));

    return shifts.map(shift => {
      const guard = userMap.get(shift.guardId);
      
      // Auto absent logic check: if past date and no checkout, or if no shift exists for a day
      // Here we just map the returned shifts. Missing shifts (absences) aren't in the DB, 
      // but if a shift is 'active' and date is older than today, it's effectively "missed checkout".
      const isPastActive = shift.status === "active" && shift.date !== getTodayDateString();
      
      return {
        ...shift,
        guardName: guard ? guard.name : "Unknown",
        displayStatus: isPastActive ? "Absent (Missed Out)" : shift.status
      };
    });
  }
});
