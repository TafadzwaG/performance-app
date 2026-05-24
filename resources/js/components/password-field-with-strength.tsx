import InputError from '@/components/input-error';
import PasswordStrengthChecklist from '@/components/password-strength-checklist';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { generateStrongPassword } from '@/lib/password-strength';
import { Sparkles } from 'lucide-react';

interface PasswordFieldWithStrengthProps {
    id: string;
    label: string;
    value: string;
    confirmation?: string;
    error?: string;
    placeholder?: string;
    autoComplete?: string;
    disabled?: boolean;
    tabIndex?: number;
    showConfirmationMatch?: boolean;
    showSuggestButton?: boolean;
    onChange: (value: string) => void;
    onSuggest?: (password: string) => void;
}

export default function PasswordFieldWithStrength({
    id,
    label,
    value,
    confirmation,
    error,
    placeholder = 'Password',
    autoComplete = 'new-password',
    disabled = false,
    tabIndex,
    showConfirmationMatch = false,
    showSuggestButton = true,
    onChange,
    onSuggest,
}: PasswordFieldWithStrengthProps) {
    const suggestPassword = () => {
        const password = generateStrongPassword();

        onChange(password);
        onSuggest?.(password);
    };

    return (
        <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
                <Label htmlFor={id}>{label}</Label>
                {showSuggestButton ? (
                    <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={suggestPassword}>
                        <Sparkles className="mr-2 h-3.5 w-3.5" />
                        Suggest strong password
                    </Button>
                ) : null}
            </div>

            <PasswordInput
                id={id}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                autoComplete={autoComplete}
                disabled={disabled}
                tabIndex={tabIndex}
            />

            {value.length > 0 || showConfirmationMatch ? (
                <PasswordStrengthChecklist
                    password={value}
                    confirmation={confirmation}
                    showConfirmationMatch={showConfirmationMatch}
                    className="rounded-lg border bg-muted/20 px-3 py-2.5"
                />
            ) : null}

            <InputError message={error} />
        </div>
    );
}
