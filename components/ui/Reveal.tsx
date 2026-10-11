import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  y?: number;
};

// Animation removed: renders its children immediately in a plain wrapper.
// The animation props are kept so existing call sites keep compiling.
export default function Reveal({ children, className = "" }: RevealProps) {
  return <div className={className}>{children}</div>;
}
