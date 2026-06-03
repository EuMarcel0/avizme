import { STEPS } from "@/lib/marketing/content";

export function HowItWorksSection() {
  return (
    <section
      id="como-funciona"
      className="scroll-mt-20 border-b border-border/60 bg-muted/20 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Como funciona
          </h2>
          <p className="mt-4 text-muted-foreground">
            Três passos do cadastro ao primeiro aviso recebido.
          </p>
        </div>
        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {STEPS.map((item) => (
            <li key={item.step} className="relative text-center md:text-left">
              <span
                className="inline-flex size-10 items-center justify-center rounded-full bg-primary font-heading text-lg font-bold text-primary-foreground"
                aria-hidden
              >
                {item.step}
              </span>
              <h3 className="mt-4 font-heading text-lg font-semibold">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
