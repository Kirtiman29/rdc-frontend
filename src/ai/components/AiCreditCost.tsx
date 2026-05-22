import { Zap } from "lucide-react";

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
      className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-300 ${className}`}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#ff1a1a]/20 bg-[#ff1a1a]/10">
        <Zap className="h-3 w-3 text-[#ff4d4d]" strokeWidth={2.3} />
      </span>
      <span>{label}</span>
      <span className="text-white">{credits}</span>
    </span>
  );
}
