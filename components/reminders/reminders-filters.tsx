"use client";

import { Search } from "lucide-react";

import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getReminderStatusFilterLabel,
  REMINDER_STATUS_FILTER_OPTIONS_ONGOING,
  type ReminderStatusFilter
} from "@/lib/reminders/reminder-status";
import { cn } from "@/lib/utils";

type RemindersFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  status: ReminderStatusFilter;
  onStatusChange: (value: ReminderStatusFilter) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  layout?: "inline" | "stacked";
  showStatusFilter?: boolean;
  className?: string;
};

const fieldClass = "flex min-w-0 shrink-0 flex-col gap-1";

export function RemindersFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  layout = "inline",
  showStatusFilter = true,
  className
}: RemindersFiltersProps) {
  const isStacked = layout === "stacked";
  return (
    <div
      className={cn(
        isStacked ? "flex flex-col gap-4" : "flex min-w-0 flex-nowrap items-end gap-2 overflow-x-auto pb-0.5 px-1",
        className
      )}
    >
      <div className={cn(fieldClass, isStacked ? "w-full" : "min-w-[12rem] flex-1")}>
        <Label htmlFor='reminder-search' className='text-xs'>
          Nome ou mensagem
        </Label>
        <div className='relative'>
          <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            id='reminder-search'
            placeholder='Buscar…'
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className='pl-9'
          />
        </div>
      </div>

      {showStatusFilter ? (
        <div className={cn(fieldClass, isStacked ? "w-full" : "w-[11.5rem]")}>
          <Label htmlFor='reminder-status' className='text-xs'>
            Status
          </Label>
          <Select
            value={status}
            onValueChange={value => {
              if (value === "todos" || value === "active" || value === "inactive") {
                onStatusChange(value);
              }
            }}
          >
            <SelectTrigger id='reminder-status' className='w-full'>
              <SelectValue placeholder='Selecione o status'>{getReminderStatusFilterLabel(status)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {REMINDER_STATUS_FILTER_OPTIONS_ONGOING.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className={cn(fieldClass, isStacked ? "w-full" : "w-[10.5rem]")}>
        <Label htmlFor='date-from' className='text-xs'>
          Data (de)
        </Label>
        <DatePicker id='date-from' value={dateFrom || undefined} onChange={onDateFromChange} placeholder='De' />
      </div>

      <div className={cn(fieldClass, isStacked ? "w-full" : "w-[10.5rem]")}>
        <Label htmlFor='date-to' className='text-xs'>
          Data (até)
        </Label>
        <DatePicker id='date-to' value={dateTo || undefined} onChange={onDateToChange} placeholder='Até' />
      </div>
    </div>
  );
}
