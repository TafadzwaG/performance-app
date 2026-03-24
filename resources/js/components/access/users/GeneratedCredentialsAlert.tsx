import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { KeyRound } from 'lucide-react';

interface GeneratedCredential {
    name: string;
    email: string;
    password: string;
}

export default function GeneratedCredentialsAlert({ credentials }: { credentials?: GeneratedCredential[] | null }) {
    if (!credentials || credentials.length === 0) {
        return null;
    }

    return (
        <Alert className="border-foreground/10 bg-muted/30">
            <KeyRound className="h-4 w-4" />
            <AlertTitle>Generated passwords</AlertTitle>
            <AlertDescription className="space-y-3">
                <p>These credentials were not emailed. Copy them now because they are only shown once.</p>

                <div className="space-y-2">
                    {credentials.map((credential) => (
                        <div key={credential.email} className="rounded-lg border bg-background px-3 py-2">
                            <div className="text-sm font-medium text-foreground">{credential.name}</div>
                            <div className="text-xs text-muted-foreground">{credential.email}</div>
                            <div className="mt-1 font-mono text-sm text-foreground">{credential.password}</div>
                        </div>
                    ))}
                </div>
            </AlertDescription>
        </Alert>
    );
}
