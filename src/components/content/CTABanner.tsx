import { MessageCircle } from "lucide-react";

interface CTABannerProps {
  title: string;
  description: string;
  buttonText: string;
}

const CTABanner = ({ title, description, buttonText }: CTABannerProps) => {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="rounded-[28px] bg-green-600 px-4 py-8 text-white shadow-sm sm:px-10 sm:py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
            <p className="mt-3 text-base leading-7 text-green-50">
              {description}
            </p>
          </div>
          <a
            href="https://wa.me/34657100100?text=Hello"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-green-700 transition-transform hover:scale-[1.01]"
          >
            <MessageCircle className="h-4 w-4" />
            {buttonText}
          </a>
        </div>
      </div>
    </section>
  );
};

export default CTABanner;
