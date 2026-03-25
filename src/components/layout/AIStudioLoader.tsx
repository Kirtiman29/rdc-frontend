import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function AIStudioLoader({ onFinish }: { onFinish: () => void }) {
  const navigate = useNavigate();

  // ✅ FIX: ref inside component
  const hasTriggered = useRef(false);

  // Sequence States
  const [isTypingDone, setIsTypingDone] = useState(false);
  const [showSecondary, setShowSecondary] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const fullText = "AI Studio";
  const characters = fullText.split("");

  // ✅ FINAL NAVIGATION (restore this)
useEffect(() => {
  if (isExiting) {
    navigate("/ai-studio/home"); // 🔥 FIRST navigate

    const timer = setTimeout(() => {
      onFinish(); // 🔥 THEN remove loader
    }, 800); // small delay so new page render ho jaye

    return () => clearTimeout(timer);
  }
}, [isExiting]);

  // ✅ CONTROLLED EXIT (single source)
  useEffect(() => {
    if (showSecondary) {
      const timer = setTimeout(() => {
        setIsExiting(true);
      }, 1800); // full hold time
      return () => clearTimeout(timer);
    }
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
          className="fixed inset-0 z-[9999] bg-[#0f0f0f] flex items-center justify-center overflow-hidden"
        >
          {/* Background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vh] bg-[radial-gradient(circle,_rgba(255,26,26,0.05)_0%,_rgba(15,15,15,1)_70%)]" />
          </div>

          <div className="relative z-10 flex flex-col items-center w-full">
            {/* Welcome */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="text-gray-500 uppercase tracking-[0.8em] text-[10px] md:text-xs mb-10"
            >
              Welcome to
            </motion.p>

            {/* Main Text */}
            <div className="relative flex items-center justify-center min-h-[140px] w-full px-4">
              <motion.h1 className="text-6xl md:text-9xl font-bold flex whitespace-nowrap">
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
                      if (
                        index === characters.length - 1 &&
                        !hasTriggered.current
                      ) {
                        hasTriggered.current = true;

                        // slight hold after typing
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

              {/* Shine */}
              <motion.div
                initial={{ x: "-150%", opacity: 0 }}
                animate={
                  isTypingDone
                    ? { x: "150%", opacity: [0, 0.4, 0] }
                    : {}
                }
                transition={{ duration: 2 }}
                onAnimationComplete={() => setShowSecondary(true)}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[35deg]"
              />
            </div>

            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={showSecondary ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="mt-16 flex flex-col items-center gap-8"
            >
              <p className="text-gray-600 text-[10px] md:text-sm tracking-[0.5em] uppercase opacity-40">
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