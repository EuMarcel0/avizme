import type { PlanTier } from "@/lib/billing/plans";
import { getPlanFeatures, PLAN_LIMITS } from "@/lib/billing/plans";

export const HERO = {
  eyebrow: "Lembretes, avisos e alertas automáticos",
  title: "Nunca mais esqueça o que importa",
  subtitle:
    "Agende lembretes e recados no e-mail, SMS ou WhatsApp — como um avise-me confiável para consultas, reuniões, medicamentos, pagamentos e sua agenda.",
  primaryCta: "Começar grátis",
  secondaryCta: "Ver planos",
} as const;

export const TRUST_POINTS = [
  "Sem cartão para começar",
  "E-mail no plano Free",
  "SMS e WhatsApp no Pro",
] as const;

export const FEATURES = [
  {
    title: "Vários canais, uma agenda",
    description:
      "Escolha e-mail, SMS ou WhatsApp por lembrete. No plano Business, envie listas de destinatários por canal.",
    icon: "channels" as const,
  },
  {
    title: "Agendamentos flexíveis",
    description:
      'Uma vez, várias datas, intervalos, semanal ou mensal. No Free, comece com o modo "Uma vez".',
    icon: "calendar" as const,
  },
  {
    title: "Controle e histórico",
    description:
      "Acompanhe lembretes ativos, pausados e ciclos finalizados. Tudo organizado em um painel simples.",
    icon: "history" as const,
  },
  {
    title: "Limites claros por plano",
    description:
      "Saiba quantos envios você usou no período. Transparência para escalar do Free ao Business.",
    icon: "chart" as const,
  },
] as const;

export const STEPS = [
  {
    step: "1",
    title: "Crie sua conta",
    description: "Cadastro rápido com e-mail. Configure telefone para SMS e WhatsApp.",
  },
  {
    step: "2",
    title: "Monte o lembrete",
    description: "Título, mensagem, calendário, horários e canais — tudo em um formulário guiado.",
  },
  {
    step: "3",
    title: "Receba no horário",
    description: "O Avizme dispara automaticamente quando chega a hora do seu aviso.",
  },
] as const;

export const CHANNELS = [
  {
    name: "E-mail",
    description: "Ideal para resumos, links e avisos detalhados. Até 10 por dia no Free.",
    slug: "email",
  },
  {
    name: "SMS",
    description: "Mensagem direta no celular. Disponível nos planos Pro e Business.",
    slug: "sms",
  },
  {
    name: "WhatsApp",
    description: "O canal que todo mundo abre. Pro e Business com cotas mensais generosas.",
    slug: "whatsapp",
  },
] as const;

export const FAQ_ITEMS = [
  {
    question: "O Avizme é gratuito?",
    answer:
      "Sim. O plano Free inclui lembretes por e-mail com limite diário e até 5 lembretes ativos. Para SMS, WhatsApp e agendamentos avançados, assine o Pro ou Business.",
  },
  {
    question: "Preciso de cartão de crédito para testar?",
    answer:
      "Não. Você pode criar conta e usar o plano Free sem cartão. A assinatura paga só é necessária quando quiser upgrade.",
  },
  {
    question: "Quais tipos de agendamento existem?",
    answer:
      "Uma vez, mesmo dia com vários horários, datas específicas, intervalos, semanal e mensal. O plano Free começa com agendamento único; planos pagos liberam todos os modos.",
  },
  {
    question: "Como funcionam SMS e WhatsApp?",
    answer:
      "Cadastre seu número no perfil. No Pro, os avisos vão para seu telefone. No Business, você pode definir listas de destinatários por lembrete.",
  },
  {
    question: "Os lembretes são enviados automaticamente?",
    answer:
      "Sim. Após agendar, o sistema gera as ocorrências e envia nos horários configurados, respeitando os limites do seu plano.",
  },
  {
    question: "Posso cancelar a assinatura?",
    answer:
      "Sim. Gerencie sua assinatura no portal de cobrança (Stripe). Você mantém o acesso até o fim do período já pago.",
  },
  {
    question: "Serve como alarme ou aviso de consulta?",
    answer:
      "Sim. Você programa data e hora como em uma agenda ou calendário, e o Avizme envia o alerta no canal escolhido — útil para consultas, exames e compromissos.",
  },
  {
    question: "Posso usar para lembrar reuniões e pagamentos?",
    answer:
      "Sim. Crie lembretes de reunião com antecedência ou avisos de boleto recorrentes. SMS e WhatsApp ajudam em alertas rápidos; e-mail em avisos com mais detalhe.",
  },
  {
    question: "O Avizme substitui um “lembre-me” ou “avise-me” manual?",
    answer:
      "A ideia é a mesma — ser avisado no momento certo —, mas automatizado: você configura uma vez e o sistema envia os recados nos horários definidos, sem precisar lembrar de disparar.",
  },
] as const;

/** Bloco semântico na home para termos de busca (indexação + links internos). */
export const SEO_DISCOVERY = {
  title: "Lembretes, alertas, avisos e agendamentos em um só lugar",
  lead: "O Avizme foi feito para quem busca lembrete automático, avise-me, alarme de compromisso, recado agendado ou agenda com avisos por mensagem — sem complicação.",
  topics: [
    {
      label: "Lembrete por SMS",
      href: "/solucoes/lembrete-por-sms",
      description: "Alertas e avisos direto no celular.",
    },
    {
      label: "Lembrete no WhatsApp",
      href: "/solucoes/lembrete-whatsapp",
      description: "Avise-me no canal que você mais abre.",
    },
    {
      label: "Lembrete por e-mail",
      href: "/solucoes/lembrete-por-email",
      description: "Comece grátis na caixa de entrada.",
    },
    {
      label: "Agendar lembretes",
      href: "/solucoes/agendar-lembretes",
      description: "Calendário, agenda e horários flexíveis.",
    },
    {
      label: "Avisos e alertas",
      href: "/solucoes/avisos-e-alertas",
      description: "Alarmes e avisos automáticos.",
    },
    {
      label: "Lembrete de reunião",
      href: "/solucoes/lembrete-reuniao",
      description: "Não perca calls e compromissos.",
    },
    {
      label: "Lembrete de medicamento",
      href: "/solucoes/lembrete-medicamento",
      description: "Doses no horário certo.",
    },
    {
      label: "Lembrete de pagamento",
      href: "/solucoes/lembrete-pagamento",
      description: "Vencimentos e boletos.",
    },
    {
      label: "Recados agendados",
      href: "/solucoes/recados-agendados",
      description: "Mensagens programadas.",
    },
  ],
} as const;

export type MarketingPlanCard = {
  tier: PlanTier;
  label: string;
  description: string;
  features: { text: string; included: boolean }[];
  highlighted?: boolean;
  cta: string;
  ctaHref: string;
};

const PLAN_CARDS: Omit<
  MarketingPlanCard,
  "label" | "description" | "features"
>[] = [
  { tier: "free", cta: "Criar conta grátis", ctaHref: "/cadastro" },
  {
    tier: "pro",
    highlighted: true,
    cta: "Assinar Pro",
    ctaHref: "/cadastro?plano=pro",
  },
  {
    tier: "business",
    cta: "Assinar Business",
    ctaHref: "/cadastro?plano=business",
  },
];

export function getMarketingPlans(): MarketingPlanCard[] {
  return PLAN_CARDS.map((card) => {
    const limits = PLAN_LIMITS[card.tier];
    return {
      ...card,
      label: limits.label,
      description: limits.description,
      features: getPlanFeatures(card.tier).filter((f) => f.included),
    };
  });
}

export const USE_CASES = [
  "Consultas e exames",
  "Contas e boletos",
  "Medicamentos",
  "Reuniões e follow-ups",
  "Aniversários e datas especiais",
] as const;
