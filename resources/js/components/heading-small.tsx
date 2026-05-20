export default function HeadingSmall({ title, description }: { title: string; description?: string }) {
    return (
        <header>
            <h3 className="font-display text-foreground mb-1 text-lg font-light tracking-tight">{title}</h3>
            {description && <p className="text-muted-foreground text-[12px] leading-relaxed">{description}</p>}
        </header>
    );
}
