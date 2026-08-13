import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function GlassCard({ children, className = "", ...rest }: Props) {
  return (
    <div
      className={`glass-card rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
