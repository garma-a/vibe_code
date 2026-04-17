"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Rows3, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  ManagerRoom,
  ManagerSystemBooking,
  ManagerTimeSlot,
} from "@/features/manager-dashboard/queries";

type CalendarView = "weekly" | "monthly";
type CalendarToastType = "success" | "error" | "info";

interface ReadOnlyCalendarProps {
  rooms: ManagerRoom[];
  timeSlots: ManagerTimeSlot[];
  fetchSystemBookingsAction: (
    startDate: string,
    endDate: string,
  ) => Promise<ManagerSystemBooking[]>;
  onToast: (message: string, type: CalendarToastType) => void;
}

export function ReadOnlyCalendar({
  rooms,
  timeSlots,
  fetchSystemBookingsAction,
  onToast,
}: ReadOnlyCalendarProps) {
  const [viewMode, setViewMode] = useState<CalendarView>("weekly");
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [bookings, setBookings] = useState<ManagerSystemBooking[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const range = useMemo(() => {
    if (viewMode === "weekly") {
      const start = startOfWeek(anchorDate);
      const end = addDays(start, 6);
      return { start, end };
    }

    const monthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    const monthEnd = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0);
    return { start: monthStart, end: monthEnd };
  }, [anchorDate, viewMode]);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const data = await fetchSystemBookingsAction(
          toIsoDate(range.start),
          toIsoDate(range.end),
        );
        if (alive) setBookings(data);
      } catch (error) {
        if (alive) {
          console.error("Failed to load manager calendar bookings:", error);
          onToast("Could not load calendar data.", "error");
        }
      } finally {
        if (alive) setIsLoading(false);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, [fetchSystemBookingsAction, onToast, range.end, range.start]);

  const weeklyDays = useMemo(() => {
    if (viewMode !== "weekly") return [];
    return Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(anchorDate), index));
  }, [anchorDate, viewMode]);

  const bookingsByDateAndSlot = useMemo(() => {
    const map = new Map<string, ManagerSystemBooking[]>();

    for (const booking of bookings) {
      if (!booking.time_slot_id) continue;
      const key = `${booking.date}__${booking.time_slot_id}`;
      const current = map.get(key) ?? [];
      current.push(booking);
      map.set(key, current);
    }

    for (const [, list] of map) {
      list.sort((a, b) => {
        const roomA = a.rooms?.name ?? "";
        const roomB = b.rooms?.name ?? "";
        return roomA.localeCompare(roomB);
      });
    }

    return map;
  }, [bookings]);

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, ManagerSystemBooking[]>();

    for (const booking of bookings) {
      const current = map.get(booking.date) ?? [];
      current.push(booking);
      map.set(booking.date, current);
    }

    return map;
  }, [bookings]);

  const monthGrid = useMemo(() => {
    if (viewMode !== "monthly") return [] as Array<Date | null>;
    return buildMonthGrid(anchorDate);
  }, [anchorDate, viewMode]);

  const nextPeriod = () => {
    if (viewMode === "weekly") {
      setAnchorDate((current) => addDays(current, 7));
      return;
    }
    setAnchorDate(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, current.getDate()),
    );
  };

  const previousPeriod = () => {
    if (viewMode === "weekly") {
      setAnchorDate((current) => addDays(current, -7));
      return;
    }
    setAnchorDate(
      (current) => new Date(current.getFullYear(), current.getMonth() - 1, current.getDate()),
    );
  };

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#0C2340]">System Calendar (Read Only)</h2>
            <p className="mt-1 text-sm text-slate-500">
              Visibility across all active rooms and slots. Editing is disabled for Branch Manager.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={viewMode === "weekly" ? "default" : "outline"}
              className={
                viewMode === "weekly"
                  ? "bg-[#0C2340] text-white hover:bg-[#0a1d35]"
                  : "border-slate-200 text-slate-700"
              }
              onClick={() => setViewMode("weekly")}
            >
              <Rows3 className="mr-1.5 h-4 w-4" />
              Weekly
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === "monthly" ? "default" : "outline"}
              className={
                viewMode === "monthly"
                  ? "bg-[#0C2340] text-white hover:bg-[#0a1d35]"
                  : "border-slate-200 text-slate-700"
              }
              onClick={() => setViewMode("monthly")}
            >
              <Grid3X3 className="mr-1.5 h-4 w-4" />
              Monthly
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <CalendarDays className="h-4 w-4 text-[#0C2340]" />
            {viewMode === "weekly"
              ? `${formatDay(range.start)} - ${formatDay(range.end)}`
              : formatMonth(anchorDate)}
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" size="icon" variant="outline" onClick={previousPeriod}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button type="button" size="icon" variant="outline" onClick={nextPeriod}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <Legend tone="lecture" label="Lecture / fixed classes" />
          <Legend tone="multi-approved" label="Multi-purpose (final approved)" />
          <Legend tone="pending" label="Pending approvals" />
        </div>

        <div className="mt-3 text-xs text-slate-400">
          Active rooms: {rooms.length} | Active slots: {timeSlots.length}
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
          Loading calendar data...
        </div>
      ) : viewMode === "weekly" ? (
        <div className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="min-w-[1000px]">
            <div className="grid grid-cols-[180px_repeat(7,minmax(0,1fr))] border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <div className="px-4 py-3">Time Slot</div>
              {weeklyDays.map((day) => (
                <div key={day.toISOString()} className="border-l border-slate-200 px-3 py-3">
                  {formatWeekday(day)}
                </div>
              ))}
            </div>

            {timeSlots.map((slot) => (
              <div
                key={slot.id}
                className="grid grid-cols-[180px_repeat(7,minmax(0,1fr))] border-b border-slate-100 last:border-b-0"
              >
                <div className="px-4 py-3 text-sm font-medium text-slate-700">{slot.slot_name}</div>

                {weeklyDays.map((day) => {
                  const dateKey = toIsoDate(day);
                  const cellKey = `${dateKey}__${slot.id}`;
                  const entries = bookingsByDateAndSlot.get(cellKey) ?? [];

                  return (
                    <div key={cellKey} className="border-l border-slate-100 px-2 py-2">
                      {entries.length === 0 ? (
                        <div className="rounded-md border border-dashed border-slate-200 px-2 py-3 text-center text-xs text-slate-400">
                          No bookings
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-semibold text-slate-500">
                            {entries.length}/{rooms.length || 1} rooms booked
                          </p>
                          {entries.slice(0, 3).map((booking) => (
                            <div
                              key={booking.id}
                              className={`rounded-md border px-2 py-1 text-[11px] font-medium ${bookingClass(booking)}`}
                              title={`${booking.rooms?.name ?? "Room"} - ${booking.profiles?.full_name ?? "Unknown"}`}
                            >
                              <p className="truncate">{booking.rooms?.name ?? "Room TBA"}</p>
                              <p className="truncate text-[10px] opacity-80">
                                {booking.profiles?.full_name ?? "Unknown"}
                              </p>
                            </div>
                          ))}
                          {entries.length > 3 ? (
                            <p className="text-[10px] font-semibold text-slate-400">
                              +{entries.length - 3} more
                            </p>
                          ) : null}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="grid min-w-[900px] grid-cols-7 border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="border-l border-slate-200 px-3 py-3 first:border-l-0">
                {label}
              </div>
            ))}
          </div>

          <div className="grid min-w-[900px] grid-cols-7">
            {monthGrid.map((day, index) => {
              const dateKey = day ? toIsoDate(day) : "";
              const dayBookings = day ? bookingsByDate.get(dateKey) ?? [] : [];

              return (
                <div
                  key={`${dateKey || "empty"}-${index}`}
                  className="min-h-36 border-l border-t border-slate-100 p-3 first:border-l-0"
                >
                  {day ? (
                    <>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-800">{day.getDate()}</span>
                        <span className="text-[11px] text-slate-400">{dayBookings.length} events</span>
                      </div>

                      {dayBookings.length === 0 ? (
                        <p className="text-xs text-slate-400">No bookings</p>
                      ) : (
                        <div className="space-y-1.5">
                          {summarizeDay(dayBookings).map((line) => (
                            <div
                              key={line.label}
                              className={`rounded-md border px-2 py-1 text-[11px] font-medium ${line.className}`}
                            >
                              {line.label}: {line.count}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function Legend({ tone, label }: { tone: "lecture" | "multi-approved" | "pending"; label: string }) {
  const className =
    tone === "lecture"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : tone === "multi-approved"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span className={`rounded-full border px-2 py-0.5 font-semibold ${className}`}>{label}</span>
  );
}

function summarizeDay(bookings: ManagerSystemBooking[]) {
  const lectureCount = bookings.filter((booking) => booking.room_type === "lecture").length;
  const multiApprovedCount = bookings.filter(
    (booking) => booking.room_type === "multi-purpose" && booking.branch_manager_status === "approved",
  ).length;
  const pendingCount = bookings.filter(
    (booking) => booking.status === "pending" || booking.branch_manager_status === "pending",
  ).length;

  const lines = [
    {
      label: "Lecture",
      count: lectureCount,
      className: "border-blue-200 bg-blue-50 text-blue-700",
    },
    {
      label: "Multi-purpose",
      count: multiApprovedCount,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    {
      label: "Pending",
      count: pendingCount,
      className: "border-amber-200 bg-amber-50 text-amber-700",
    },
  ];

  return lines.filter((line) => line.count > 0);
}

function bookingClass(booking: ManagerSystemBooking) {
  if (booking.room_type === "lecture") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (booking.room_type === "multi-purpose" && booking.branch_manager_status === "approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date: Date) {
  const start = new Date(date);
  const shift = start.getDay();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - shift);
  return start;
}

function buildMonthGrid(anchorDate: Date) {
  const first = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
  const last = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0);
  const days: Array<Date | null> = [];

  for (let i = 0; i < first.getDay(); i += 1) {
    days.push(null);
  }

  for (let day = 1; day <= last.getDate(); day += 1) {
    days.push(new Date(anchorDate.getFullYear(), anchorDate.getMonth(), day));
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatDay(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
