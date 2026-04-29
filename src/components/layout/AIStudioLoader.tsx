import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function AIStudioLoader({ onFinish }: { onFinish: () => void }) {
  const hasTriggered = useRef(false);
  const [isTypingDone, setIsTypingDone] = useState(false);
  const [showSecondary, setShowSecondary] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const fullText = "AI Studio";
  const characters = fullText.split("");

  useEffect(() => {
    if (!isExiting) return;

    const timer = setTimeout(() => {
      onFinish();
    }, 800);

    return () => clearTimeout(timer);
  }, [isExiting, onFinish]);

  useEffect(() => {
    if (!showSecondary) return;

    const timer = setTimeout(() => {
      setIsExiting(true);
    }, 1800);

    return () => clearTimeout(timer);
  }, [showSecondary]);

  return (
    <AnimatePresence mode="wait">
      {!isExiting && (
        <motion.div
          key="loader-container"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.02,
            filter: "blur(10px)",
            transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] },
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#0f0f0f]"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/2 top-1/2 h-[100vh] w-[100vw] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,_rgba(255,26,26,0.05)_0%,_rgba(15,15,15,1)_70%)]" />
          </div>

          <div className="relative z-10 flex w-full flex-col items-center">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="mb-10 text-[10px] uppercase tracking-[0.8em] text-gray-500 md:text-xs"
            >
              Welcome to
            </motion.p>

            <div className="relative flex min-h-[140px] w-full items-center justify-center px-4">
              <motion.h1 className="flex whitespace-nowrap text-6xl font-bold md:text-9xl">
                {characters.map((char, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, filter: "blur(15px)", y: 20 }}
                    animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                    transition={{
                      delay: 0.5 + index * 0.15,
                      duration: 0.8,
                    }}
                    onAnimationComplete={() => {
                      if (index === characters.length - 1 && !hasTriggered.current) {
                        hasTriggered.current = true;
                        setTimeout(() => setIsTypingDone(true), 800);
                      }
                    }}
                    className={
                      index > 1
                        ? "bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent"
                        : "text-white"
                    }
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                ))}
              </motion.h1>

              <motion.div
                initial={{ x: "-150%", opacity: 0 }}
                animate={isTypingDone ? { x: "150%", opacity: [0, 0.4, 0] } : {}}
                transition={{ duration: 2 }}
                onAnimationComplete={() => setShowSecondary(true)}
                className="absolute inset-0 skew-x-[35deg] bg-gradient-to-r from-transparent via-white/20 to-transparent"
              />
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={showSecondary ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="mt-16 flex flex-col items-center gap-8"
            >
              <p className="text-[10px] uppercase tracking-[0.5em] text-gray-600 opacity-40 md:text-sm">
                Powered by generative intelligence
              </p>

              <motion.div
                initial={{ width: 0 }}
                animate={showSecondary ? { width: "240px" } : { width: 0 }}
                transition={{ duration: 1 }}
                className="h-[1px] bg-gradient-to-r from-transparent via-[#ff1a1a]/40 to-transparent"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
