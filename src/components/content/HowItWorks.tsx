export interface HowItWorksStep {
  number: number;
  title: string;
  description: string;
}

interface HowItWorksProps {
  steps: HowItWorksStep[];
  title: string;
  description: string;
}

const HowItWorks = ({ steps, title, description }: HowItWorksProps) => {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="how-it-works-title">
      <div className="mb-8 max-w-2xl">
        <h2 id="how-it-works-title" className="text-3xl font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        <p className="mt-3 text-base leading-7 text-slate-600">
          {description}
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {steps.map((step) => (
          <article key={step.number} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-600 text-lg font-semibold text-white">
              {step.number}
            </div>
            <h3 className="mt-5 text-xl font-semibold text-slate-900">{step.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
