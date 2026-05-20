import { useEffect, useRef, useState } from 'react';

interface Options {
    /** 0–1 fraction of the element that must be visible before firing. */
    threshold?: number;
    /** Margin around the root for early/late triggering. */
    rootMargin?: string;
    /** When true, the observer disconnects after the first trigger (one-shot reveal). */
    once?: boolean;
}

export function useInView<T extends HTMLElement = HTMLDivElement>({
    threshold = 0.18,
    rootMargin = '0px 0px -10% 0px',
    once = true,
}: Options = {}) {
    const ref = useRef<T | null>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        if (typeof IntersectionObserver === 'undefined') {
            setInView(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setInView(true);
                        if (once) observer.disconnect();
                    } else if (!once) {
                        setInView(false);
                    }
                }
            },
            { threshold, rootMargin },
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [threshold, rootMargin, once]);

    return { ref, inView };
}
