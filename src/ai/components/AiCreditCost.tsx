type AiCreditCostProps = {
  credits: number;
  label?: string;
  className?: string;
};

export default function AiCreditCost({
  credits,
  label = "Credits",
  className = "",
}: AiCreditCostProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-[#ff1a1a]/20 bg-[#ff1a1a]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff7a7a] ${className}`}
    >
      {label}: {credits}
    </span>
  );
}
