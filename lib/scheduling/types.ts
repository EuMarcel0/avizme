import type { ScheduleType } from "@/lib/schedule-types";

export type ScheduleRow = {
  id: string;
  reminder_id: string;
  schedule_type: ScheduleType | string;
  start_date: string | null;
  end_date: string | null;
  interval_days: number | null;
  times: string[];
  dates: string[];
  weekdays: number[];
  day_of_month: number | null;
  config: Record<string, unknown> | null;
};

export type ExpandedSlot = {
  scheduleId: string;
  date: string;
  time: string;
};

export type GenerationRange = {
  from: Date;
  to: Date;
};

export const GENERATION_HORIZON_DAYS = 35;

export type DeliveryChannel = "sms" | "whatsapp" | "email";

export type OccurrenceInsert = {
  reminder_id: string;
  schedule_id: string;
  scheduled_at: string;
  channel: DeliveryChannel;
  status: "pending";
};
