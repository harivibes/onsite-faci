export default function Hero({
  eyebrow,
  title,
  subtitle,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string | React.ReactNode;
  align?: "left" | "center";
}) {
  return (
    <section
      className={`mb-6 ${align === "center" ? "text-center" : ""}`}
    >
      {eyebrow && (
        <div className="eyebrow text-brutal-red mb-2 inline-flex items-center gap-2">
          <span className="inline-block w-6 h-[2px] bg-brutal-red" />
          <span>{eyebrow}</span>
        </div>
      )}
      <h1 className="display text-[34px] sm:text-[40px] text-brutal-dark leading-[1.02]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-[14.5px] text-brutal-dark/75 max-w-prose">
          {subtitle}
        </p>
      )}
    </section>
  );
}
