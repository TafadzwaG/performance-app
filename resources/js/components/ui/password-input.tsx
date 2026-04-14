import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';
import * as React from 'react';

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, 'type'>;

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(({ className, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);

    return (
        <div className="relative">
            <Input ref={ref} type={visible ? 'text' : 'password'} className={cn('pr-10', className)} {...props} />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-9 w-9 text-muted-foreground hover:text-foreground"
                onClick={() => setVisible((current) => !current)}
                aria-label={visible ? 'Hide password' : 'Show password'}
            >
                {visible ? <EyeOff /> : <Eye />}
            </Button>
        </div>
    );
});

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
