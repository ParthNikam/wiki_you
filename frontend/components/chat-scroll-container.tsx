"use client";

import { ReactNode, useEffect, useRef } from "react";

type ChatScrollContainerProps = {
  children: ReactNode;
  className?: string;
  scrollKey: number;
};

export function ChatScrollContainer({
  children,
  className = "",
  scrollKey,
}: ChatScrollContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [scrollKey]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
