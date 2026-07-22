type FaqEntry = { q: string; a: string };

const FAQ: FaqEntry[] = [
  {
    q: "Does paykit hold my money?",
    a: "No. paykit only renders a PayNow QR code. Customers pay you directly through their own bank app — paykit never touches funds.",
  },
  {
    q: "How do I know a payment came through?",
    a: "A customer marks an order as paid after scanning; you confirm it yourself once you see it land in your bank account. There's no automatic bank-side verification.",
  },
  {
    q: "Do I need a business bank account?",
    a: "No — paykit works with either your UEN or your personal mobile number registered for PayNow.",
  },
  {
    q: "What does the free plan include?",
    a: "Unlimited transactions on the free plan, no cap. Pro adds revenue reports and refund tracking.",
  },
];

function FaqItem({ q, a }: FaqEntry) {
  return (
    <details className="group overflow-hidden rounded-xl border border-border bg-card open:border-primary/50">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset">
        <span className="text-base font-semibold leading-snug text-foreground">
          {q}
        </span>
        <span
          aria-hidden
          className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-border text-lg leading-none text-muted-foreground transition-transform group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <div className="px-5 pb-5 text-sm leading-relaxed text-foreground/80">
        {a}
      </div>
    </details>
  );
}

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-5 py-16">
      <h2 className="mb-10 text-center text-3xl font-semibold">Questions</h2>
      <div className="space-y-3">
        {FAQ.map((item) => (
          <FaqItem key={item.q} {...item} />
        ))}
      </div>
    </section>
  );
}
