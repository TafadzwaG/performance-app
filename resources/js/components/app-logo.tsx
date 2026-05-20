import BrandLogo from '@/components/brand-logo';

export default function AppLogo() {
    return (
        <>
            <div className="bg-sidebar-primary text-sidebar-primary-foreground relative flex aspect-square size-9 items-center justify-center overflow-hidden rounded-md shadow-sm">
                <div className="bg-brand-sand absolute inset-1 rounded-[3px]" />
                <BrandLogo
                    className="relative size-5 object-contain"
                    iconClassName="relative size-5 fill-current text-brand-ink"
                />
            </div>
            <div className="ml-1 grid flex-1 text-left">
                <span className="font-display text-foreground truncate text-[15px] leading-none font-medium tracking-tight">
                    Performance Studio
                </span>
                <span className="font-mono-brand text-foreground/55 mt-1 truncate text-[9px] tracking-[0.22em] uppercase">
                    Appraisal Management
                </span>
            </div>
        </>
    );
}
