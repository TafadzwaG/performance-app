import { evaluatePasswordStrength } from '@/lib/password-strength';
import { cn } from '@/lib/utils';
import { Check, Circle } from 'lucide-react';

interface PasswordStrengthChecklistProps {
    password: string;
    confirmation?: string;
    showConfirmationMatch?: boolean;
    className?: string;
}

export default function PasswordStrengthChecklist({
    password,
    confirmation,
    showConfirmationMatch = false,
    className,
}: PasswordStrengthChecklistProps) {
    const rules = evaluatePasswordStrength(password);
    const passwordsMatch = confirmation !== undefined && confirmation.length > 0 && password === confirmation;

    return (
        <ul className={cn('space-y-1.5 text-sm', className)}>
            {rules.map((rule) => (
                <li key={rule.id} className="flex items-center gap-2">
                    {rule.passed ? (
                        <Check className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                    ) : (
                        <Circle className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden="true" />
                    )}
                    <span className={cn(rule.passed ? 'text-foreground' : 'text-muted-foreground')}>{rule.label}</span>
                </li>
            ))}

            {showConfirmationMatch ? (
                <li className="flex items-center gap-2">
                    {passwordsMatch ? (
                        <Check className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                    ) : (
                        <Circle className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden="true" />
                    )}
                    <span className={cn(passwordsMatch ? 'text-foreground' : 'text-muted-foreground')}>Passwords match</span>
                </li>
            ) : null}
        </ul>
    );
}
