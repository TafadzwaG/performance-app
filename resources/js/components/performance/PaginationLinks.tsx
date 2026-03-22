import { Button } from '@/components/ui/button';
import type { Paginated } from '@/types/performance';
import { Link } from '@inertiajs/react';

interface PaginationLinksProps<T> {
    paginated: Paginated<T>;
}

export default function PaginationLinks<T>({ paginated }: PaginationLinksProps<T>) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm text-muted-foreground">
            <span>
                Showing {paginated.from ?? 0} to {paginated.to ?? 0} of {paginated.total}
            </span>
            <div className="flex items-center gap-2">
                {paginated.links.map((link) => (
                    <Button key={`${link.label}-${link.url}`} variant={link.active ? 'default' : 'outline'} size="sm" asChild disabled={!link.url}>
                        {link.url ? (
                            <Link href={link.url} preserveScroll>
                                <span dangerouslySetInnerHTML={{ __html: link.label }} />
                            </Link>
                        ) : (
                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                        )}
                    </Button>
                ))}
            </div>
        </div>
    );
}
