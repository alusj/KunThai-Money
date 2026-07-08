import { motion, AnimatePresence } from "framer-motion";

/**
 * Animates navigation between stages inside a sheet or card:
 * the incoming stage grows in, the outgoing one collapses away.
 * Re-key with `stageKey` whenever the visible stage changes.
 */
export default function SheetStage({ stageKey, children }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={stageKey}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.28, ease: [0.32, 0.72, 0.24, 1] }}
        style={{ transformOrigin: "50% 30%" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
