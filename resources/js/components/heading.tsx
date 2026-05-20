export default function Heading({ title, description }: { title: string; description?: string }) {
    return (
        <div className="mb-2 space-y-1">
            <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                <span className="bg-brand-sand mr-2 inline-block h-px w-6 align-middle" />
                Performance
            </div>
            <h2 className="font-display text-foreground text-balance text-3xl leading-[1.05] font-light tracking-tight md:text-4xl">
                {title}
            </h2>
            {description ? <p className="text-muted-foreground max-w-2xl text-[13px] leading-relaxed">{description}</p> : null}
        </div>
    );
}
