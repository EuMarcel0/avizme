import { AppHistory } from "@/components/app/app-history";
import { userHasHistoryReminders } from "@/lib/reminders/list-reminders";

export default async function HistoricoPage() {
  const hasHistory = await userHasHistoryReminders();

  return <AppHistory hasHistory={hasHistory} />;
}
