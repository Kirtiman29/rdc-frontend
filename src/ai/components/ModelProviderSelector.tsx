import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Zap } from "lucide-react";

import type { TextToImageProvider } from "@/api/aiApi";
import {
  getModelProviderLabel,
  MODEL_PROVIDER_OPTIONS,
} from "@/ai/constants/modelProviders";

type ModelProviderSelectorProps = {
  value: TextToImageProvider;
  onChange: (value: TextToImageProvider) => void;
};

export default function ModelProviderSelector({
  value,
  onChange,
}: ModelProviderSelectorProps) {
  const [open, setOpen] = useState(false);
  const selectedLabel = getModelProviderLabel(value);

  return (
    <div className={`relative ${open ? "z-50" : "z-10"}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-2 rounded-xl border border-[#2B3138]/60 bg-[#20242A] px-4 py-2.5 text-xs font-bold text-[#F5F7FA] transition hover:border-[#E11D2E]/50 hover:bg-[#252A31]"
      >
        <Zap className="h-4 w-4 text-[#A1A8B3]" />
        <span>Model: {selectedLabel}</span>
        <ChevronDown className="h-4 w-4 text-[#A1A8B3]" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-30 cursor-default"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-0 z-40 mb-2 w-72 rounded-[20px] border border-[#2B3138] bg-[#1C2025] p-4 shadow-2xl space-y-2"
            >
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#A1A8B3]">
                Image Model
              </p>
              <div className="flex flex-col gap-1.5">
                {MODEL_PROVIDER_OPTIONS.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      onChange(model.id);
                      setOpen(false);
                    }}
                    className={`w-full rounded-xl border px-3 py-2 text-left transition-all duration-300 ${
                      value === model.id
                        ? "border-[#E11D2E] bg-[#E11D2E]/10 text-white shadow-[0_0_8px_rgba(225,29,46,0.2)]"
                        : "border-[#2B3138] bg-[#181B1F] text-[#A1A8B3] hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <span className="block text-xs font-bold">{model.label}</span>
                    <span className="mt-0.5 block text-[10px] font-medium text-[#A1A8B3]">
                      {model.description}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
