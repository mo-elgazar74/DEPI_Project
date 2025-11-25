import { useEffect, useRef, useState } from "react";

export default function useScrollReveal(
  { threshold = 0, rootMargin = "-20% 0px -60% 0px", once = true, debug = false } = {}
) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (debug) console.debug("useScrollReveal: visible -> true", el);
            setVisible(true);
            if (once) obs.unobserve(el);
          } else {
            if (debug) console.debug("useScrollReveal: visible -> false", el);
            if (!once) setVisible(false);
          }
        }
      },
      { threshold, rootMargin }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, rootMargin, once, debug]);

  return [ref, visible];
}
