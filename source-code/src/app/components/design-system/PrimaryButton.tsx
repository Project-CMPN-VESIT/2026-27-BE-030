import { motion } from "motion/react";
import { ReactNode } from "react";

interface PrimaryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "accent" | "emergency";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  disabled?: boolean;
}

export function PrimaryButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
}: PrimaryButtonProps) {
  const variants = {
    primary: "bg-gradient-to-r from-[#14B8A6] to-[#0F766E] text-white shadow-lg shadow-[#14B8A6]/30",
    secondary: "bg-gradient-to-r from-[#3B82F6] to-[#1E40AF] text-white shadow-lg shadow-[#3B82F6]/30",
    accent: "bg-gradient-to-r from-[#A78BFA] to-[#7C3AED] text-white shadow-lg shadow-[#A78BFA]/30",
    emergency: "bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white shadow-lg shadow-[#EF4444]/30",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-2xl font-medium transition-all ${variants[variant]} ${
        sizes[size]
      } ${fullWidth ? "w-full" : ""} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {children}
    </motion.button>
  );
}
