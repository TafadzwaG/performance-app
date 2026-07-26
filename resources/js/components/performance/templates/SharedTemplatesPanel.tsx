import PaginationLinks from '@/components/performance/PaginationLinks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Paginated, Template } from '@/types/performance';
import { Link, router } from '@inertiajs/react';
import { Building2, Download, Eye, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface SourceOrganization {
    id: number;
    name: string;
    slug: string;
}

interface Props {
    sourceOrganizations: SourceOrganization[];
    selectedSourceOrganization: SourceOrganization | null;
    sharedTemplates: Paginated<Template> | null;
    canImport: boolean;
}

export default function SharedTemplatesPanel({
    sourceOrganizations,
    selectedSourceOrganization,
    sharedTemplates,
    canImport,
}: Props) {
    const [importingId, setImportingId] = useState<number | null>(null);
    const [pendingImport, setPendingImport] = useState<{ template: Template; organization: SourceOrganization } | null>(null);

    if (sourceOrganizations.length === 0) {
        return null;
    }

    const selectOrganization = (organizationId: string) => {
        router.get(
            route('performance.templates.index'),
            organizationId ? { source_organization_id: organizationId } : {},
            { preserveScroll: true, replace: true },
        );
    };

    const confirmImport = () => {
        if (!pendingImport) {
            return;
        }

        setImportingId(pendingImport.template.id);
        router.post(
            route('performance.templates.shared.import', {
                organization: pendingImport.organization.id,
                template: pendingImport.template.id,
            }),
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setImportingId(null);
                    setPendingImport(null);
                },
            },
        );
    };

    return (
        <>
            <Card className="shadow-sm">
                <CardHeader className="border-b bg-muted/20">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Building2 className="h-4 w-4" />
                                <CardTitle className="text-lg">Templates from other organisations</CardTitle>
                            </div>
                            <CardDescription>
                                Browse appraisal templates from organisations you can access, then import a copy into
                                this organisation.
                            </CardDescription>
                        </div>

                        <div className="grid w-full max-w-sm gap-2">
                            <Label htmlFor="source-organization">Source organisation</Label>
                            <Select
                                value={selectedSourceOrganization ? String(selectedSourceOrganization.id) : ''}
                                onValueChange={selectOrganization}
                            >
                                <SelectTrigger id="source-organization">
                                    <SelectValue placeholder="Choose an organisation" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sourceOrganizations.map((organization) => (
                                        <SelectItem key={organization.id} value={String(organization.id)}>
                                            {organization.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {!selectedSourceOrganization ? (
                        <div className="flex min-h-[220px] items-center justify-center p-6 text-sm text-muted-foreground">
                            Select an organisation to view its templates.
                        </div>
                    ) : !sharedTemplates || sharedTemplates.data.length === 0 ? (
                        <div className="flex min-h-[220px] items-center justify-center p-6 text-sm text-muted-foreground">
                            No templates found in {selectedSourceOrganization.name}.
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-muted/30 text-left">
                                        <tr>
                                            <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                Template
                                            </th>
                                            <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                Version
                                            </th>
                                            <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                Business / Values
                                            </th>
                                            <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sharedTemplates.data.map((template) => {
                                            const business = template.business_weight_percent ?? 0;
                                            const values = template.values_weight_percent ?? 0;
                                            const isImporting = importingId === template.id;

                                            return (
                                                <tr key={template.id} className="border-t hover:bg-muted/20">
                                                    <td className="px-6 py-5">
                                                        <div className="space-y-2">
                                                            <div className="font-semibold text-foreground">{template.name}</div>
                                                            <div className="flex flex-wrap gap-1">
                                                                {template.is_default ? (
                                                                    <Badge variant="secondary" className="font-normal">
                                                                        Default
                                                                    </Badge>
                                                                ) : null}
                                                                {!template.is_active ? (
                                                                    <Badge variant="outline" className="font-normal">
                                                                        Inactive
                                                                    </Badge>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <Badge variant="secondary" className="font-normal">
                                                            {template.version}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className="font-semibold text-foreground">
                                                            {business} / {values}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex flex-wrap justify-end gap-2">
                                                            <Button asChild variant="outline" size="sm">
                                                                <Link
                                                                    href={route('performance.templates.shared.show', {
                                                                        organization: selectedSourceOrganization.id,
                                                                        template: template.id,
                                                                    })}
                                                                >
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View
                                                                </Link>
                                                            </Button>

                                                            {canImport ? (
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    disabled={isImporting}
                                                                    onClick={() =>
                                                                        setPendingImport({
                                                                            template,
                                                                            organization: selectedSourceOrganization,
                                                                        })
                                                                    }
                                                                >
                                                                    {isImporting ? (
                                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <Download className="mr-2 h-4 w-4" />
                                                                    )}
                                                                    Use in this org
                                                                </Button>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex flex-col gap-4 border-t bg-muted/10 px-6 py-4 md:flex-row md:items-center md:justify-between">
                                <span className="text-xs font-medium text-muted-foreground">
                                    Templates from {selectedSourceOrganization.name}
                                </span>
                                <PaginationLinks paginated={sharedTemplates} />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <Dialog open={pendingImport !== null} onOpenChange={(open) => !open && setPendingImport(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Import template</DialogTitle>
                        <DialogDescription>
                            A copy of <strong>{pendingImport?.template.name}</strong> from{' '}
                            <strong>{pendingImport?.organization.name}</strong> will be created in your current
                            organisation. Any missing rating scales, perspectives, or competencies will be copied
                            automatically.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setPendingImport(null)}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={confirmImport} disabled={importingId !== null}>
                            {importingId !== null ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="mr-2 h-4 w-4" />
                            )}
                            Import template
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
