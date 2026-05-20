import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, Loader2, Search, X } from 'lucide-react';
import * as React from 'react';

export interface AsyncOption {
    value: number | string;
    label: string;
    [key: string]: unknown;
}

interface AsyncSearchSelectProps<T extends AsyncOption = AsyncOption> {
    /** Endpoint that returns `{ results: T[] }`. The query is appended as `?q=...`. */
    endpoint: string;
    /** Selected value (numeric id or string). Use `null` for "nothing selected". */
    value: number | string | null;
    /** Called whenever the user picks (or clears) an option. */
    onChange: (value: T['value'] | null, option: T | null) => void;
    /** Placeholder shown inside the trigger when nothing is selected. */
    placeholder?: string;
    /** Text inside the empty popover. */
    emptyText?: string;
    /** Label shown for the value when no full option is cached (e.g. on first render). */
    fallbackLabel?: string | null;
    /** Extra query string segments appended verbatim (e.g. exclude ids). */
    extraQuery?: Record<string, string | number | undefined>;
    /** Render a richer row inside the dropdown. */
    renderOption?: (option: T) => React.ReactNode;
    /** Render the trigger display when an option is selected. */
    renderSelected?: (option: T | null) => React.ReactNode;
    /** Debounce in ms (default 180ms — feels instant, still rate-limits). */
    debounceMs?: number;
    /** Disable the trigger. */
    disabled?: boolean;
    /** Hide the clear button on the trigger. */
    nonClearable?: boolean;
    /** Optional id for the trigger button (label htmlFor). */
    id?: string;
    /** Extra className for the trigger. */
    className?: string;
    /**
     * When used inside a modal dialog, pass the dialog body element so the
     * dropdown portals inside the dialog and stays within the focus trap.
     */
    portalContainer?: HTMLElement | null;
}

interface CacheEntry<T> {
    results: T[];
    fetchedAt: number;
}

const RESPONSE_CACHE = new Map<string, CacheEntry<AsyncOption>>();
const SELECTED_CACHE = new Map<string, AsyncOption>();
const CACHE_TTL_MS = 30_000;

function serializeExtraQuery(extra?: Record<string, string | number | undefined>): string {
    if (!extra) {
        return '';
    }

    return Object.entries(extra)
        .filter(([, v]) => v !== undefined && v !== '')
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${String(v)}`)
        .join('&');
}

function buildCacheKey(endpoint: string, q: string, extra?: Record<string, string | number | undefined>) {
    const serialized = serializeExtraQuery(extra);
    return [endpoint, `q=${q}`, serialized].filter(Boolean).join('|');
}

function isPopoverTarget(target: EventTarget | null): boolean {
    return target instanceof HTMLElement && Boolean(target.closest('[data-radix-popover-content]'));
}

export function AsyncSearchSelect<T extends AsyncOption = AsyncOption>({
    endpoint,
    value,
    onChange,
    placeholder = 'Search…',
    emptyText = 'No results.',
    fallbackLabel,
    extraQuery,
    renderOption,
    renderSelected,
    debounceMs = 180,
    disabled,
    nonClearable,
    id,
    className,
    portalContainer = null,
}: AsyncSearchSelectProps<T>) {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState('');
    const [results, setResults] = React.useState<T[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [activeIndex, setActiveIndex] = React.useState(0);
    const [selectedOption, setSelectedOption] = React.useState<T | null>(() => {
        const cached = value != null ? SELECTED_CACHE.get(`${endpoint}|${value}`) : null;
        return (cached as T) ?? null;
    });

    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const abortRef = React.useRef<AbortController | null>(null);
    const listboxRef = React.useRef<HTMLUListElement | null>(null);
    const lastFetchKey = React.useRef<string>('');

    const extraQueryKey = serializeExtraQuery(extraQuery);
    const nestedInDialog = portalContainer != null;

    // Reset cached selected option if value cleared externally.
    React.useEffect(() => {
        if (value == null) {
            setSelectedOption(null);
            return;
        }
        const cached = SELECTED_CACHE.get(`${endpoint}|${value}`);
        if (cached) {
            setSelectedOption(cached as T);
        }
    }, [endpoint, value]);

    const runFetch = React.useCallback(
        async (q: string) => {
            const key = buildCacheKey(endpoint, q, extraQuery);

            const cached = RESPONSE_CACHE.get(key);
            if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
                setResults(cached.results as T[]);
                setLoading(false);
                return;
            }

            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;
            setLoading(true);

            try {
                const params = new URLSearchParams({ q });
                if (extraQuery) {
                    Object.entries(extraQuery).forEach(([k, v]) => {
                        if (v !== undefined && v !== '') {
                            params.append(k, String(v));
                        }
                    });
                }
                const response = await fetch(`${endpoint}?${params.toString()}`, {
                    signal: controller.signal,
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin',
                });
                if (!response.ok) {
                    setResults([]);
                    return;
                }
                const payload = (await response.json()) as { results?: T[] };
                const next = payload.results ?? [];
                RESPONSE_CACHE.set(key, { results: next, fetchedAt: Date.now() });
                if (lastFetchKey.current === key) {
                    setResults(next);
                }
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    setResults([]);
                }
            } finally {
                if (lastFetchKey.current === key) {
                    setLoading(false);
                }
            }
        },
        [endpoint, extraQuery, extraQueryKey],
    );

    // Debounced search while the panel is open (includes an immediate fetch on open/query change).
    React.useEffect(() => {
        if (!open) {
            return;
        }

        const key = buildCacheKey(endpoint, query, extraQuery);
        lastFetchKey.current = key;
        const delay = query === '' ? 0 : debounceMs;
        const timer = window.setTimeout(() => runFetch(query), delay);

        return () => window.clearTimeout(timer);
    }, [open, query, debounceMs, endpoint, extraQueryKey, extraQuery, runFetch]);

    React.useEffect(() => {
        if (!open) {
            return;
        }

        const frame = window.requestAnimationFrame(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
        });

        setActiveIndex(0);

        return () => window.cancelAnimationFrame(frame);
    }, [open]);

    React.useEffect(() => {
        if (!open) {
            setQuery('');
        }
    }, [open]);

    React.useEffect(() => {
        if (!open) {
            return;
        }
        const list = listboxRef.current;
        if (!list) {
            return;
        }
        const child = list.children[activeIndex] as HTMLElement | undefined;
        child?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex, open, results]);

    const selectOption = (option: T) => {
        SELECTED_CACHE.set(`${endpoint}|${option.value}`, option);
        setSelectedOption(option);
        onChange(option.value as T['value'], option);
        setOpen(false);
    };

    const clear = (event: React.MouseEvent) => {
        event.stopPropagation();
        setSelectedOption(null);
        onChange(null, null);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        event.stopPropagation();

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
        } else if (event.key === 'Enter') {
            event.preventDefault();
            const option = results[activeIndex];
            if (option) {
                selectOption(option);
            }
        } else if (event.key === 'Escape') {
            event.preventDefault();
            setOpen(false);
        }
    };

    const displayLabel = selectedOption?.label ?? fallbackLabel ?? placeholder;

    return (
        <Popover open={open} onOpenChange={setOpen} modal={!nestedInDialog}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    id={id}
                    disabled={disabled}
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    className={cn(
                        'border-input bg-background ring-offset-background flex h-10 w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:border-ring/60',
                        !selectedOption && 'text-muted-foreground',
                        className,
                    )}
                >
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                        {renderSelected ? (
                            renderSelected(selectedOption)
                        ) : (
                            <span className="truncate">{displayLabel}</span>
                        )}
                    </span>
                    <span className="flex items-center gap-1">
                        {selectedOption && !nonClearable ? (
                            <span
                                role="button"
                                tabIndex={-1}
                                onClick={clear}
                                className="hover:bg-secondary/40 grid h-5 w-5 place-items-center rounded transition-colors"
                                aria-label="Clear selection"
                            >
                                <X className="h-3 w-3" />
                            </span>
                        ) : null}
                        <ChevronsUpDown className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                    </span>
                </button>
            </PopoverTrigger>
            <PopoverContent
                container={portalContainer}
                align="start"
                sideOffset={4}
                className={cn(
                    'w-[var(--radix-popover-trigger-width)] max-w-[min(480px,calc(100vw-2rem))] p-0',
                    nestedInDialog ? 'z-[60]' : 'z-[100]',
                )}
                onOpenAutoFocus={(event) => event.preventDefault()}
                onCloseAutoFocus={(event) => {
                    if (nestedInDialog) {
                        event.preventDefault();
                    }
                }}
                onInteractOutside={(event) => {
                    if (nestedInDialog && isPopoverTarget(event.target)) {
                        event.preventDefault();
                    }
                }}
            >
                <div
                    className="border-foreground/10 flex items-center gap-2 border-b px-3 py-2"
                    onPointerDown={(event) => event.stopPropagation()}
                >
                    <Search className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                    <input
                        ref={inputRef}
                        type="search"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onKeyDown={handleKeyDown}
                        onPointerDown={(event) => event.stopPropagation()}
                        placeholder={placeholder}
                        className="text-foreground placeholder:text-muted-foreground flex-1 bg-transparent text-sm outline-none"
                    />
                    {loading ? <Loader2 className="text-muted-foreground h-3.5 w-3.5 shrink-0 animate-spin" /> : null}
                </div>
                <ul ref={listboxRef} role="listbox" className="max-h-72 overflow-y-auto py-1">
                    {results.length === 0 && !loading ? (
                        <li className="text-muted-foreground px-3 py-6 text-center text-[13px]">{emptyText}</li>
                    ) : null}
                    {results.map((option, index) => {
                        const isSelected = option.value === value;
                        const isActive = index === activeIndex;

                        return (
                            <li
                                key={String(option.value)}
                                role="option"
                                aria-selected={isSelected}
                                onMouseDown={(event) => {
                                    event.preventDefault();
                                    selectOption(option);
                                }}
                                onMouseEnter={() => setActiveIndex(index)}
                                className={cn(
                                    'flex cursor-pointer items-center gap-2 px-3 py-2 text-[13px] transition-colors',
                                    isActive && 'bg-secondary/30',
                                    isSelected && 'text-foreground',
                                )}
                            >
                                <Check
                                    className={cn(
                                        'h-3.5 w-3.5 shrink-0',
                                        isSelected ? 'text-brand-pine opacity-100 dark:text-brand-sand' : 'opacity-0',
                                    )}
                                />
                                <div className="min-w-0 flex-1">
                                    {renderOption ? (
                                        renderOption(option)
                                    ) : (
                                        <span className="truncate">{option.label}</span>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </PopoverContent>
        </Popover>
    );
}
