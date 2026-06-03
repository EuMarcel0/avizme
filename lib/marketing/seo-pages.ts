/** Páginas temáticas para SEO long-tail (indexação por intenção de busca). */

export type SeoPage = {
  slug: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  paragraphs: string[];
  keywords: string[];
  relatedSlugs: string[];
};

export const SEO_PAGES: SeoPage[] = [
  {
    slug: "lembrete-por-sms",
    title: "Lembrete por SMS — alertas no celular",
    description:
      "Agende lembretes por SMS com o Avizme. Receba avisos, alarmes e recados no seu número no horário marcado. Ideal para consultas e compromissos.",
    h1: "Lembrete por SMS que chega no horário",
    intro:
      "Programe avisos e lembretes por SMS sem depender de apps complexos. O Avizme envia a mensagem automaticamente no dia e hora que você definir.",
    paragraphs: [
      "SMS continua sendo um dos canais mais diretos para alertas urgentes: consultas médicas, vencimento de contas, retirada de medicamentos ou qualquer compromisso que não pode passar batido.",
      "No plano Pro, você cadastra seu número e cria lembretes com agendamento único, semanal, mensal ou em datas específicas — como uma agenda inteligente que avisa por mensagem de texto.",
      "Combine título e corpo da mensagem, pause ou reative lembretes pelo painel e acompanhe o histórico de envios realizados.",
    ],
    keywords: [
      "lembrete SMS",
      "alerta SMS",
      "avisos por SMS",
      "agendar SMS",
      "lembrete celular",
    ],
    relatedSlugs: ["lembrete-whatsapp", "agendar-lembretes", "avisos-e-alertas"],
  },
  {
    slug: "lembrete-whatsapp",
    title: "Lembrete no WhatsApp — avise-me automático",
    description:
      "Lembretes e avisos pelo WhatsApp com agendamento flexível. Avizme envia recados no horário certo para você não esquecer reuniões, pagamentos e rotinas.",
    h1: "Lembrete no WhatsApp, no horário certo",
    intro:
      "Use o WhatsApp como canal de lembrete: mensagens claras, leitura rápida e entrega automática conforme sua agenda.",
    paragraphs: [
      "Muitas pessoas buscam “avise-me”, “lembre-me” ou “alerta no WhatsApp” para não depender da memória. O Avizme automatiza esse envio com calendário e repetição.",
      "Defina data, hora e frequência (semanal, mensal, intervalos ou datas específicas) e receba o aviso no seu número cadastrado.",
      "No plano Business, envie para listas de números por lembrete — útil para equipes, família ou clientes.",
    ],
    keywords: [
      "lembrete WhatsApp",
      "avise-me WhatsApp",
      "alerta WhatsApp",
      "recado WhatsApp",
      "agendar WhatsApp",
    ],
    relatedSlugs: ["lembrete-por-sms", "lembrete-reuniao", "recados-agendados"],
  },
  {
    slug: "lembrete-por-email",
    title: "Lembrete por e-mail — avisos e alertas na caixa de entrada",
    description:
      "Agende lembretes por e-mail grátis no Avizme. Alertas, avisos e recados com calendário, repetição e histórico. Comece sem cartão.",
    h1: "Lembrete por e-mail para sua rotina",
    intro:
      "O plano Free inclui lembretes por e-mail: ideal para quem quer testar alertas automáticos antes de usar SMS ou WhatsApp.",
    paragraphs: [
      "E-mail funciona bem para avisos com mais contexto: links, instruções, anexos na mensagem e lembretes de reuniões com detalhes.",
      "Agende uma vez ou configure repetições; o Avizme dispara no horário programado como um alarme silencioso na sua caixa de entrada.",
      "Escale para Pro ou Business quando precisar de SMS, WhatsApp ou listas de destinatários por lembrete.",
    ],
    keywords: [
      "lembrete e-mail",
      "alerta e-mail",
      "aviso por e-mail",
      "agendar e-mail",
      "lembrete caixa de entrada",
    ],
    relatedSlugs: ["agendar-lembretes", "lembrete-pagamento", "avisos-e-alertas"],
  },
  {
    slug: "agendar-lembretes",
    title: "Agendar lembretes — agenda, calendário e horários",
    description:
      "Agende lembretes com calendário flexível: uma vez, semanal, mensal, intervalos e datas específicas. Avizos por e-mail, SMS e WhatsApp.",
    h1: "Agendar lembretes com calendário flexível",
    intro:
      "Transforme sua agenda em avisos automáticos: escolha o canal (e-mail, SMS ou WhatsApp) e deixe o Avizme lembrar por você.",
    paragraphs: [
      "Se você pesquisa “agendamento”, “agenda” ou “calendário de lembretes”, precisa de mais do que um alarme do celular — precisa de mensagens que chegam sozinhas.",
      "Configure horários únicos ou recorrentes, vários disparos no mesmo dia e lembretes em datas específicas ao longo do ano.",
      "Consultas, reuniões, medicamentos e pagamentos ficam organizados em um painel com status ativo, pausado e histórico.",
    ],
    keywords: [
      "agendar lembrete",
      "agendamento de avisos",
      "agenda lembretes",
      "calendário lembretes",
      "programar alerta",
    ],
    relatedSlugs: ["lembrete-reuniao", "lembrete-medicamento", "avisos-e-alertas"],
  },
  {
    slug: "avisos-e-alertas",
    title: "Avisos e alertas automáticos — lembretes que não falham",
    description:
      "Crie avisos, alertas e alarmes por mensagem com o Avizme. Lembretes automáticos por e-mail, SMS e WhatsApp. Comece grátis.",
    h1: "Avisos e alertas automáticos, sem esforço",
    intro:
      "Substitua post-its e alarmes soltos por avisos programados que chegam no canal certo na hora certa.",
    paragraphs: [
      "Termos como “aviso”, “alerta”, “alarme” e “avise-me” expressam a mesma necessidade: ser notificado antes que algo importante seja esquecido.",
      "O Avizme centraliza esses avisos em lembretes configuráveis, com limite de envio transparente por plano.",
      "Do lembrete pontual ao aviso recorrente semanal ou mensal, você controla tudo em um só lugar.",
    ],
    keywords: [
      "avisos automáticos",
      "alertas automáticos",
      "alarme lembrete",
      "avise-me",
      "lembre-me",
    ],
    relatedSlugs: ["agendar-lembretes", "recados-agendados", "lembrete-por-email"],
  },
  {
    slug: "lembrete-reuniao",
    title: "Lembrete de reunião — aviso antes do compromisso",
    description:
      "Lembrete de reunião por e-mail, SMS ou WhatsApp. Agende avisos com antecedência e repetição para calls, clientes e equipe.",
    h1: "Lembrete de reunião para não chegar atrasado",
    intro:
      "Agende um ou vários avisos antes de cada reunião — por e-mail, SMS ou WhatsApp — e mantenha sua agenda sob controle.",
    paragraphs: [
      "Reuniões presenciais ou online exigem lembretes com antecedência: 15 minutos, 1 hora ou no dia anterior.",
      "Use agendamento “mesmo dia com vários horários” ou repetição semanal para calls fixas com clientes ou equipe.",
      "O histórico de envios confirma que o aviso foi disparado — útil para auditoria de comunicação.",
    ],
    keywords: [
      "lembrete reunião",
      "aviso reunião",
      "alerta reunião",
      "agenda reunião",
      "lembrete call",
    ],
    relatedSlugs: ["agendar-lembretes", "lembrete-whatsapp", "recados-agendados"],
  },
  {
    slug: "lembrete-medicamento",
    title: "Lembrete de medicamento — alarme por SMS ou WhatsApp",
    description:
      "Lembrete de medicamento automático no horário certo. Avise-me por SMS, WhatsApp ou e-mail com repetição diária ou em intervalos.",
    h1: "Lembrete de medicamento no horário da dose",
    intro:
      "Programe avisos para tomar remédios, suplementos ou tratamentos contínuos — com repetição que funciona como um alarme confiável.",
    paragraphs: [
      "Lembretes de medicamento precisam de pontualidade: intervalos fixos, vários horários no dia ou dias específicos da semana.",
      "Receba o aviso no canal que você realmente olha — WhatsApp, SMS ou e-mail — sem instalar apps pesados.",
      "Pause temporariamente ou ajuste horários quando o tratamento mudar, direto no painel.",
    ],
    keywords: [
      "lembrete medicamento",
      "alarme remédio",
      "aviso tomar remédio",
      "lembrete dose",
      "horário medicamento",
    ],
    relatedSlugs: ["lembrete-por-sms", "agendar-lembretes", "avisos-e-alertas"],
  },
  {
    slug: "lembrete-pagamento",
    title: "Lembrete de pagamento — aviso de boleto e conta",
    description:
      "Lembrete de pagamento e vencimento por e-mail, SMS ou WhatsApp. Evite juros com avisos agendados e recorrentes.",
    h1: "Lembrete de pagamento antes do vencimento",
    intro:
      "Agende avisos de boletos, faturas e contas recorrentes — como um alarme financeiro que chega por mensagem.",
    paragraphs: [
      "Configure lembretes alguns dias antes do vencimento e repita mensalmente para contas fixas (aluguel, assinaturas, impostos).",
      "SMS e WhatsApp são ideais para um aviso rápido; e-mail para detalhes e links de pagamento.",
      "Mantenha histórico de envios para saber que o aviso foi entregue no período correto.",
    ],
    keywords: [
      "lembrete pagamento",
      "aviso boleto",
      "lembrete vencimento",
      "alerta conta",
      "lembrete financeiro",
    ],
    relatedSlugs: ["lembrete-por-email", "agendar-lembretes", "avisos-e-alertas"],
  },
  {
    slug: "recados-agendados",
    title: "Recados agendados — envie mensagens no horário certo",
    description:
      "Recados agendados por e-mail, SMS e WhatsApp. Programe mensagens, avisos e lembretes automáticos com o Avizme.",
    h1: "Recados agendados que se enviam sozinhos",
    intro:
      "Programe recados para você ou, no plano Business, para listas de contatos — como uma central de avisos automáticos.",
    paragraphs: [
      "“Recado”, “aviso” e “lembrete” são formas de dizer que alguém precisa ser informado em um momento específico.",
      "Escreva a mensagem, escolha o canal e defina calendário e repetição; o Avizme cuida do disparo.",
      "Útil para lembrar clientes, pacientes, alunos ou a própria rotina pessoal.",
    ],
    keywords: [
      "recado agendado",
      "mensagem agendada",
      "enviar recado automático",
      "programar mensagem",
      "aviso agendado",
    ],
    relatedSlugs: ["lembrete-whatsapp", "lembrete-reuniao", "avisos-e-alertas"],
  },
];

const slugIndex = new Map(SEO_PAGES.map((p) => [p.slug, p]));

export function getSeoPage(slug: string): SeoPage | undefined {
  return slugIndex.get(slug);
}

export function getAllSeoSlugs(): string[] {
  return SEO_PAGES.map((p) => p.slug);
}
