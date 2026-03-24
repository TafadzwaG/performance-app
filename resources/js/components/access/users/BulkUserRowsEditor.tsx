import type { FormDataConvertible } from '@inertiajs/core';
import PasswordGeneratorField from '@/components/access/users/PasswordGeneratorField';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, UserPlus } from 'lucide-react';

export interface BulkUserRow {
    [key: string]: FormDataConvertible;
    name: string;
    email: string;
    password: string;
    force_password_change: boolean;
    send_credentials_email: boolean;
}

interface BulkUserRowsEditorProps {
    rows: BulkUserRow[];
    errors: Record<string, string | undefined>;
    updateRow: <K extends keyof BulkUserRow>(index: number, key: K, value: BulkUserRow[K]) => void;
    addRow: () => void;
    removeRow: (index: number) => void;
}

export default function BulkUserRowsEditor({ rows, errors, updateRow, addRow, removeRow }: BulkUserRowsEditorProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">Users to Create</h3>
                    <p className="text-xs text-muted-foreground">Each row becomes a new user account.</p>
                </div>

                <Button type="button" variant="outline" size="sm" onClick={addRow}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Row
                </Button>
            </div>

            <div className="space-y-4">
                {rows.map((row, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                            <CardTitle className="text-base">User Row {index + 1}</CardTitle>

                            {rows.length > 1 ? (
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            ) : null}
                        </CardHeader>

                        <CardContent className="space-y-5">
                            <div className="grid gap-5 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor={`bulk-user-name-${index}`}>Full name</Label>
                                    <Input
                                        id={`bulk-user-name-${index}`}
                                        value={row.name}
                                        onChange={(event) => updateRow(index, 'name', event.target.value)}
                                        placeholder="Rutendo Moyo"
                                    />
                                    <InputError message={errors[`users.${index}.name`]} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor={`bulk-user-email-${index}`}>Email address</Label>
                                    <Input
                                        id={`bulk-user-email-${index}`}
                                        type="email"
                                        value={row.email}
                                        onChange={(event) => updateRow(index, 'email', event.target.value)}
                                        placeholder="rutendo.moyo@example.com"
                                    />
                                    <InputError message={errors[`users.${index}.email`]} />
                                </div>
                            </div>

                            <PasswordGeneratorField
                                id={`bulk-user-password-${index}`}
                                label="Initial password"
                                value={row.password}
                                error={errors[`users.${index}.password`]}
                                onChange={(value) => updateRow(index, 'password', value)}
                            />

                            <div className="grid gap-3 md:grid-cols-2">
                                <label className="flex items-start gap-3 rounded-lg border px-4 py-3">
                                    <Checkbox
                                        checked={row.send_credentials_email}
                                        onCheckedChange={(checked) => updateRow(index, 'send_credentials_email', !!checked)}
                                    />
                                    <div>
                                        <div className="text-sm font-medium text-foreground">Send credentials email</div>
                                        <div className="text-xs text-muted-foreground">
                                            Email the password and login link to this user.
                                        </div>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 rounded-lg border px-4 py-3">
                                    <Checkbox
                                        checked={row.force_password_change}
                                        onCheckedChange={(checked) => updateRow(index, 'force_password_change', !!checked)}
                                    />
                                    <div>
                                        <div className="text-sm font-medium text-foreground">Require password change</div>
                                        <div className="text-xs text-muted-foreground">
                                            Redirect the user to change their password after first sign-in.
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
