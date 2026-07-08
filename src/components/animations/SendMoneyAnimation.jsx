import { motion, AnimatePresence } from "framer-motion";
import { Check, Coins } from "lucide-react";

function initialsOf(name) {
  return (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function AvatarBubble({ name, image, highlight }) {
  return (
    <div className="flex w-24 flex-col items-center gap-2 sm:w-28">
      <motion.div
        animate={highlight ? { scale: [1, 1.12, 1] } : { scale: 1 }}
        transition={highlight ? { duration: 0.7, ease: "easeOut" } : undefined}
        className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-cyan-200/30 bg-white/10 shadow-[0_18px_50px_rgba(8,15,40,0.45)] backdrop-blur-xl sm:h-20 sm:w-20"
      >
        {image ? (
          <img src={image} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xl font-semibold text-cyan-100 sm:text-2xl">{initialsOf(name)}</span>
        )}
      </motion.div>
      <p className="line-clamp-2 text-center text-xs font-medium text-slate-200 sm:text-sm">{name}</p>
    </div>
  );
}

/**
 * Full-screen overlay shown while a transfer is in flight.
 * phase: "sending" (coins fly sender -> recipient) | "success" (checkmark pop).
 */
export default function SendMoneyAnimation({
  phase,
  amountLabel,
  senderName,
  senderImage,
  recipientName,
  recipientImage,
  actionLabel = "Sending",
  successLabel = "Sent successfully",
}) {
  const coins = [0, 1, 2];

  return (
    <AnimatePresence>
      {phase ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35 } }}
          className="fixed inset-0 z-[95] flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(110,231,255,0.14),transparent_30%),linear-gradient(180deg,#030712_0%,#0a1c3f_55%,#041126_100%)] px-6"
          role="status"
          aria-live="polite"
        >
          <div className="w-full max-w-md text-center">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.42em] text-cyan-100/70">
              {phase === "success" ? "Transfer complete" : `${actionLabel} money`}
            </p>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-4xl font-semibold text-white sm:text-5xl"
            >
              {amountLabel}
            </motion.p>

            <div className="mt-10 flex items-center justify-between gap-2">
              <AvatarBubble name={senderName} image={senderImage} highlight={false} />

              <div className="relative h-20 min-w-0 flex-1">
                <div className="absolute left-0 right-0 top-1/2 border-t-2 border-dashed border-cyan-200/25" />

                {phase === "sending" &&
                  coins.map((index) => (
                    <motion.div
                      key={index}
                      className="absolute"
                      style={{ top: "calc(50% - 18px)" }}
                      initial={{ left: "-6%", opacity: 0, scale: 0.7 }}
                      animate={{
                        left: ["-6%", "96%"],
                        opacity: [0, 1, 1, 0],
                        scale: [0.7, 1, 1, 0.7],
                      }}
                      transition={{
                        duration: 1.4,
                        times: [0, 0.18, 0.82, 1],
                        delay: index * 0.45,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-200/50 bg-[radial-gradient(circle_at_30%_30%,#fde68a,#f59e0b)] shadow-[0_10px_30px_rgba(245,158,11,0.45)]">
                        <Coins size={17} className="text-amber-900" />
                      </div>
                    </motion.div>
                  ))}

                {phase === "success" && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 320, damping: 18 }}
                    className="absolute"
                    style={{ left: "calc(50% - 28px)", top: "calc(50% - 28px)" }}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400 shadow-[0_18px_50px_rgba(52,211,153,0.5)]">
                      <Check size={30} strokeWidth={3} className="text-emerald-950" />
                    </div>
                  </motion.div>
                )}
              </div>

              <AvatarBubble
                name={recipientName}
                image={recipientImage}
                highlight={phase === "success"}
              />
            </div>

            <div className="mt-10">
              {phase === "sending" ? (
                <div className="flex items-center justify-center gap-3">
                  <span className="text-sm font-medium uppercase tracking-[0.28em] text-cyan-100/80">
                    {actionLabel}
                  </span>
                  <span className="flex gap-1.5">
                    {[0, 1, 2].map((dot) => (
                      <motion.span
                        key={dot}
                        className="h-1.5 w-1.5 rounded-full bg-cyan-200"
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 1, repeat: Infinity, delay: dot * 0.25 }}
                      />
                    ))}
                  </span>
                </div>
              ) : (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm font-medium uppercase tracking-[0.28em] text-emerald-200"
                >
                  {successLabel}
                </motion.p>
              )}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
