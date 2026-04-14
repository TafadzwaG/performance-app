import type { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type ToastTone = 'success' | 'info' | 'warning' | 'error';

interface ToastItem {
    id: string;
    tone: ToastTone;
    message: string;
}

interface PageProps extends SharedData {
    errors?: Record<string, string | string[]>;
}

const toneStyles: Record<ToastTone, string> = {
    success: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    info: 'border-sky-300 bg-sky-50 text-sky-900',
    warning: 'border-amber-300 bg-amber-50 text-amber-900',
    error: 'border-rose-300 bg-rose-50 text-rose-900',
};

const toneIcons: Record<ToastTone, typeof CircleCheck> = {
    success: CircleCheck,
    info: Info,
    warning: CircleAlert,
    error: CircleAlert,
};

export default function ThemedToaster() {
    const { props, url } = usePage<PageProps>();
    const [items, setItems] = useState<ToastItem[]>([]);
    const lastFlashKey = useRef<string>('');
    const lastErrorKey = useRef<string>('');

    const pushToast = (tone: ToastTone, message: string) => {
        if (!message.trim()) {
            return;
        }

        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setItems((current) => [...current, { id, tone, message }]);

        window.setTimeout(() => {
            setItems((current) => current.filter((item) => item.id !== id));
        }, 6500);
    };

    useEffect(() => {
        const flash = props.flash ?? {};
        const key = JSON.stringify({
            url,
            success: flash.success,
            info: flash.info,
            warning: flash.warning,
            error: flash.error,
        });

        if (key === lastFlashKey.current) {
            return;
        }

        lastFlashKey.current = key;

        if (flash.success) pushToast('success', flash.success);
        if (flash.info) pushToast('info', flash.info);
        if (flash.warning) pushToast('warning', flash.warning);
        if (flash.error) pushToast('error', flash.error);
    }, [props.flash, url]);

    useEffect(() => {
        const errorEntries = Object.values(props.errors ?? {}).flatMap((value) =>
            Array.isArray(value) ? value : [value],
        );
        const key = JSON.stringify({ url, errors: errorEntries });

        if (key === lastErrorKey.current || errorEntries.length === 0) {
            return;
        }

        lastErrorKey.current = key;
        errorEntries.forEach((message) => pushToast('error', message));
    }, [props.errors, url]);

    if (items.length === 0) {
        return null;
    }

    return (
        <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2">
            {items.map((item) => {
                const Icon = toneIcons[item.tone];

                return (
                    <div
                        key={item.id}
                        className={`pointer-events-auto rounded-lg border px-3 py-2 shadow-md backdrop-blur ${toneStyles[item.tone]}`}
                    >
                        <div className="flex items-start gap-2">
                            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                            <p className="flex-1 text-sm leading-snug">{item.message}</p>
                            <button
                                type="button"
                                className="cursor-pointer rounded p-0.5 hover:bg-black/5"
                                onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
