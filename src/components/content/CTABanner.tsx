const CTABanner = () => {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="rounded-[28px] bg-green-600 px-6 py-10 text-white shadow-sm sm:px-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight">Empieza hoy con una rutina más simple</h2>
            <p className="mt-3 text-base leading-7 text-green-50">
              Practica inglés en WhatsApp, recibe correcciones con inteligencia artificial y descubre una forma más ligera de avanzar.
            </p>
          </div>
          <a
            href="https://wa.me/34657100100?text=Hello"
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-green-700 transition-transform hover:scale-[1.01]"
          >
            Prueba gratis en WhatsApp →
          </a>
        </div>
      </div>
    </section>
  );
};

export default CTABanner;
