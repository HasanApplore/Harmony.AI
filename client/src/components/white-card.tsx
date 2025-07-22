import { ReactNode } from "react";

interface WhiteCardProps {
  children: ReactNode;
  className?: string;
}

/**
 * A white card component with purple border to be used on purple background
 * Used throughout the application for consistent UI design
 */
export default function WhiteCard({ children, className = "" }: WhiteCardProps) {
  return (
    <div className={`bg-white rounded-lg border border-purple-200 shadow-md ${className}`}>
      {children}
    </div>
  );
}