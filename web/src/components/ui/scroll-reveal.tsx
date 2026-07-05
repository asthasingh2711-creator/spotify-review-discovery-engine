"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function ScrollReveal({ children, className, delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const show = () => setVisible(true);
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.95) {
      requestAnimationFrame(show);
      return;
    }

    setVisible(false);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          show();
          observer.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px 0px 0px" },
    );
    observer.observe(el);

    const fallback = window.setTimeout(show, 400);
    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-500 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
        className,
      )}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
