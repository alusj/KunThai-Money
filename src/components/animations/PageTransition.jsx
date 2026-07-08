import { motion } from "framer-motion"

const VARIANTS = {
  // Onboarding default: screens slide in from the right and exit to the left.
  slide: {
    initial: { opacity: 0, x: 96 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -96 },
    transition: { duration: 0.45, ease: [0.32, 0.72, 0.24, 1] },
  },
  // Final pre-dashboard screen: folds shut vertically as the dashboard takes over.
  collapse: {
    initial: { opacity: 0, scale: 1.04 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scaleY: 0.02 },
    transition: { duration: 0.55, ease: [0.65, 0, 0.35, 1] },
  },
  fade: {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -40 },
    transition: { duration: 0.5 },
  },
}

export default function PageTransition({ children, variant = "slide" }) {
  const config = VARIANTS[variant] || VARIANTS.slide

  return (
    <motion.div
      initial={config.initial}
      animate={config.animate}
      exit={config.exit}
      transition={config.transition}
      style={variant === "collapse" ? { transformOrigin: "50% 42%" } : undefined}
    >
      {children}
    </motion.div>
  )
}
