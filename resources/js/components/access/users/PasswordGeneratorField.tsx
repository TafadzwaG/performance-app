import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw } from 'lucide-react';

const PASSWORD_CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';

export function generateClientPassword(length = 16) {
    return Array.from({ length }, () => PASSWORD_CHARACTERS[Math.floor(Math.random() * PASSWORD_CHARACTERS.length)]).join('');
}

interface PasswordGeneratorFieldProps {
    id: string;
    label: string;
    value: string;
    error?: string;
    placeholder?: string;
    onChange: (value: string) => void;
}

export default function PasswordGeneratorField({
    id,
    label,
    value,
    error,
    placeholder = 'Leave blank to let the system generate one automatically',
    onChange,
}: PasswordGeneratorFieldProps) {
    return (
        <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
                <Label htmlFor={id}>{label}</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => onChange(generateClientPassword())}>
                    <RefreshCw className="mr-2 h-3.5 w-3.5" />
                    Generate Password
                </Button>
            </div>

            <Input
                id={id}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                autoComplete="new-password"
            />

            <p className="text-xs text-muted-foreground">
                If credentials email is disabled, the generated password will be shown once after creation.
            </p>

            <InputError message={error} />
        </div>
    );
}
