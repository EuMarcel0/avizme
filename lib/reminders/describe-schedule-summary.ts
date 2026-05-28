import { differenceInCalendarDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  buildSchedulesFromForm,
  type BuildSchedulesInput,
} from "@/lib/reminders/build-schedules";
import { getRangeEnds, toDateString } from "@/lib/reminders/date-utils";
import { WEEKDAY_LABELS } from "@/lib/reminders/schedule-modes";

export type DeliveryChannels = {
  sms?: boolean;
  whatsapp?: boolean;
  email?: boolean;
};

export type DescribeSummaryInput = BuildSchedulesInput & {
  channels?: DeliveryChannels;
};

function formatDateBr(date: Date): string {
  return format(date, "dd/MM/yyyy", { locale: ptBR });
}

function joinPt(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} e ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
}

function uniqueSortedTimes(times: string[]): string[] {
  return [...new Set(times.filter(Boolean))].sort();
}

function formatTimesPhrase(times: string[]): string {
  const list = uniqueSortedTimes(times);
  if (list.length === 0) return "";
  if (list.length === 1) return `às ${list[0]}`;
  return `nos horários ${joinPt(list)}`;
}

function describeChannels(channels?: DeliveryChannels): string {
  const selected: string[] = [];
  if (channels?.whatsapp) selected.push("WhatsApp");
  if (channels?.sms) selected.push("SMS");
  if (channels?.email) selected.push("e-mail");

  if (selected.length === 0) {
    return " Selecione pelo menos um canal de envio acima.";
  }
  return ` via ${joinPt(selected)}.`;
}

function weekdayNames(weekdays: number[]): string[] {
  return [...weekdays]
    .sort((a, b) => a - b)
    .map((value) => {
      const found = WEEKDAY_LABELS.find((d) => d.value === value);
      return found ? found.label.toLowerCase() : String(value);
    })
    .filter(Boolean);
}

function intervalPhrase(days: number): string {
  if (days <= 1) return "todos os dias";
  return `a cada ${days} dias`;
}

function isContiguousDateRange(dates: Date[]): boolean {
  if (dates.length < 2) return false;
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const { start, end } = getRangeEnds(sorted);
  if (!start || !end) return false;
  const expectedDays = differenceInCalendarDays(end, start) + 1;
  return expectedDays === sorted.length;
}

function specificDatesPhrase(dates: Date[], times: string[]): string {
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const uniqueTimes = uniqueSortedTimes(times);
  const timePart =
    uniqueTimes.length === 1
      ? `às ${uniqueTimes[0]}`
      : `nos horários ${joinPt(uniqueTimes)}`;

  if (sorted.length === 1) {
    return `no dia ${formatDateBr(sorted[0])}, ${timePart}`;
  }

  const { start, end } = getRangeEnds(sorted);
  if (
    start &&
    end &&
    isContiguousDateRange(sorted) &&
    toDateString(start) !== toDateString(end)
  ) {
    return `todos os dias entre ${formatDateBr(start)} e ${formatDateBr(end)} (${sorted.length} dias), ${timePart} em cada dia`;
  }

  if (sorted.length <= 4) {
    const daysList = joinPt(sorted.map(formatDateBr));
    return `nos dias ${daysList}, ${timePart} em cada dia`;
  }

  return `em ${sorted.length} dias selecionados no calendário, ${timePart} em cada dia`;
}

export function describeScheduleSummary(input: DescribeSummaryInput): string {
  const schedules = buildSchedulesFromForm(input);
  const channelsSuffix = describeChannels(input.channels);

  if (schedules.length === 0) {
    return "Configure as datas e os horários no calendário para ver como ficarão os envios.";
  }

  const { mode } = input;
  const dates = input.selectedDates;
  const times = input.times.filter(Boolean);
  const timePhrase = formatTimesPhrase(times);

  let schedulePart: string;

  switch (mode) {
    case "single": {
      if (!dates[0] || !times[0]) {
        return "Configure as datas e os horários no calendário para ver como ficarão os envios.";
      }
      schedulePart = `uma única vez, no dia ${formatDateBr(dates[0])} às ${times[0]}`;
      break;
    }
    case "same_day_multi": {
      if (!dates[0]) {
        return "Configure as datas e os horários no calendário para ver como ficarão os envios.";
      }
      schedulePart = `no dia ${formatDateBr(dates[0])}, ${timePhrase}`;
      break;
    }
    case "specific_dates": {
      if (dates.length === 0) {
        return "Configure as datas e os horários no calendário para ver como ficarão os envios.";
      }
      schedulePart = specificDatesPhrase(dates, times);
      break;
    }
    case "interval": {
      if (!dates[0] || !times[0]) {
        return "Configure as datas e os horários no calendário para ver como ficarão os envios.";
      }
      const every = intervalPhrase(input.intervalDays ?? 1);
      schedulePart = `${every}, a partir de ${formatDateBr(dates[0])}, às ${times[0]}`;
      break;
    }
    case "interval_multi": {
      if (!dates[0]) {
        return "Configure as datas e os horários no calendário para ver como ficarão os envios.";
      }
      const every = intervalPhrase(input.intervalDays ?? 1);
      schedulePart = `${every}, a partir de ${formatDateBr(dates[0])}, ${timePhrase}`;
      break;
    }
    case "weekly": {
      const days = weekdayNames(input.weekdays ?? []);
      if (days.length === 0) {
        return "Selecione os dias da semana para ver como ficarão os envios.";
      }
      const daysPart = joinPt(days.map((d) => `toda ${d}`));
      const start =
        dates[0] != null
          ? `, a partir de ${formatDateBr(dates[0])}`
          : "";
      schedulePart = `${daysPart}${start}, ${timePhrase}`;
      break;
    }
    case "monthly": {
      const day = input.dayOfMonth;
      if (!day) {
        return "Informe o dia do mês para ver como ficarão os envios.";
      }
      const start =
        dates[0] != null
          ? `, a partir de ${formatDateBr(dates[0])}`
          : "";
      schedulePart = `todo dia ${day} de cada mês${start}, ${timePhrase}`;
      break;
    }
    default:
      schedulePart = `conforme ${schedules.length} regra(s) de agendamento configurada(s)`;
  }

  return `Você irá receber este lembrete ${schedulePart}${channelsSuffix}`;
}
