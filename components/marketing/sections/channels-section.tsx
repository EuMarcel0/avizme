import { CHANNELS } from "@/lib/marketing/content";

export function ChannelsSection() {
  return (
    <section className="border-b border-border/60 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Escolha como ser avisado
          </h2>
          <p className="mt-4 text-muted-foreground">
            Combine canais conforme o plano. O Free começa com e-mail; Pro e
            Business desbloqueiam SMS e WhatsApp.
          </p>
        </div>
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {CHANNELS.map((channel) => (
            <li
              key={channel.slug}
              className="rounded-lg border border-border bg-gradient-to-b from-aviz-sage/20 to-card p-6 dark:from-aviz-teal/10"
            >
              <h3 className="font-heading text-xl font-semibold">
                {channel.name}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {channel.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
