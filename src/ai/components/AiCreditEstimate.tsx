import { AnimatePresence, motion } from "framer-motion";
import { Zap } from "lucide-react";

type AiCreditEstimateProps = {
  breakdown: string;
  totalCredits: number;
  title?: string;
  className?: string;
};

export default function AiCreditEstimate({
  breakdown,
  totalCredits,
  title = "Estimated Usage",
  className = "",
}: AiCreditEstimateProps) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
            {title}
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-300">
            {breakdown}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-600">
            Total
          </p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={totalCredits}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-1 flex items-center justify-end gap-2 text-base font-bold text-white"
            >
              <Zap className="h-3.5 w-3.5 text-[#ff4d4d]" strokeWidth={2.3} />
              <span>{totalCredits}</span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-gray-400">
                Credits
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
