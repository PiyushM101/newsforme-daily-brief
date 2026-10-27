import { createFileRoute } from "@tanstack/react-router";
import { MagicLinkForm } from "@/components/magic-link-form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NewsForMe: your daily news brief" },
      { name: "description", content: "Your news. Picked for you. In your inbox every morning." },
      { property: "og:title", content: "NewsForMe: your daily news brief" },
      { property: "og:description", content: "Your news. Picked for you. In your inbox every morning." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const steps = [
  { n: "1", t: "Tell us about you", d: "A few lines about your work and what you care about." },
  { n: "2", t: "Pick up to 5 topics", d: "We suggest some. You can add your own." },
  { n: "3", t: "Choose sources and time", d: "Pick the sites you trust and when the email lands." },
];

const faqs = [
  { q: "Is it free?", a: "Yes. NewsForMe is free to use." },
  { q: "How do I stop it?", a: "Every email has a pause link. You can also pause or change it in settings at any time." },
  {
    q: "Where does the news come from?",
    a: "From the sources you choose, plus Reuters and AP. We read the latest stories and write a short summary for you.",
  },
];

function Landing() {
  return (
    <div className="mx-auto max-w-5xl px-5">
      <section className="grid gap-12 py-14 md:grid-cols-[1.15fr_1fr] md:items-center md:py-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">The morning edition</p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.05] sm:text-5xl md:text-6xl">
            Your news. Picked for you. In your inbox every morning.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            One short email a day. Only the stories that matter to you. Set it up in two minutes.
          </p>
          <div className="mt-8 max-w-lg">
            <MagicLinkForm cta="Get started" />
            <p className="mt-2 text-xs text-muted-foreground">We will email you a code. No password.</p>
          </div>
        </div>
        <SampleEmail />
      </section>

      <section className="rule-double py-12">
        <h2 className="text-3xl font-semibold">How it works</h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n}>
              <div className="font-display text-5xl font-bold text-primary">{s.n}</div>
              <h3 className="mt-2 text-xl font-semibold">{s.t}</h3>
              <p className="mt-1 text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rule-double py-12">
        <h2 className="text-3xl font-semibold">Questions</h2>
        <Accordion type="single" collapsible className="mt-4 max-w-2xl">
          {faqs.map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger className="text-base">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}

function SampleEmail() {
  const items = [
    { tag: "AI", h: "New rules for AI models get a vote next week", p: "Lawmakers set out what companies must disclose. Startups get more time." },
    { tag: "Fintech", h: "Card fees face a fresh challenge", p: "Merchants filed a new case. A ruling could change what you pay." },
    { tag: "Funding", h: "Early stage deals pick up again", p: "Seed rounds grew for a third month. Most went to AI tools." },
  ];
  return (
    <div className="rotate-1 rounded-lg border border-border bg-card p-6 shadow-paper">
      <div className="flex items-center justify-between border-b border-border pb-3 text-xs text-muted-foreground">
        <span>From: NewsForMe</span>
        <span>7:00 AM</span>
      </div>
      <div className="pt-4 text-center">
        <div className="font-display text-2xl font-bold">Your Morning Brief</div>
        <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">Tuesday, for Maya</div>
      </div>
      <div className="rule-double mt-4 space-y-4 pt-4">
        {items.map((i) => (
          <article key={i.h}>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">{i.tag}</div>
            <h4 className="font-display text-lg font-semibold leading-snug">{i.h}</h4>
            <p className="text-sm text-muted-foreground">{i.p}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
