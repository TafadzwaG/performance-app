import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from '@inertiajs/react';
import { FileUp, Link2, UploadCloud, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface EvidenceUploaderProps {
    appraisalId: number;
    objectiveId: number;
}

interface EvidenceForm {
    evidence_type: 'file' | 'link';
    file: File | null;
    url: string;
    notes: string;
    [key: string]: File | string | null;
}

export default function EvidenceUploader({ appraisalId, objectiveId }: EvidenceUploaderProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { data, setData, post, processing, reset } = useForm<EvidenceForm>({
        evidence_type: 'file',
        file: null,
        url: '',
        notes: '',
    });

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const [firstFile] = acceptedFiles;

            if (firstFile) {
                setData('file', firstFile);
            }
        },
        [setData],
    );

    const dropzone = useDropzone({
        onDrop,
        multiple: false,
        maxSize: 10 * 1024 * 1024,
    });

    const submit = () => {
        post(route('performance.appraisals.evidence.store', { appraisal: appraisalId, objective: objectiveId }), {
            forceFormData: true,
            onSuccess: () => {
                reset();
                setIsOpen(false);
            },
        });
    };

    if (!isOpen) {
        return (
            <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(true)}>
                <FileUp className="mr-1.5 h-3.5 w-3.5" />
                Add evidence
            </Button>
        );
    }

    return (
        <div className="space-y-3 rounded-lg border p-3">
            <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Evidence type</Label>
                <Badge variant="outline">Max 10MB</Badge>
            </div>

            <Select
                value={data.evidence_type}
                onValueChange={(value: 'file' | 'link') => {
                    setData('evidence_type', value);
                    if (value === 'file') {
                        setData('url', '');
                    } else {
                        setData('file', null);
                    }
                }}
            >
                <SelectTrigger className="w-full">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="file">File upload</SelectItem>
                    <SelectItem value="link">Web link</SelectItem>
                </SelectContent>
            </Select>

            {data.evidence_type === 'file' ? (
                <div
                    {...dropzone.getRootProps()}
                    className={`cursor-pointer rounded-lg border border-dashed p-4 transition-colors ${
                        dropzone.isDragActive ? 'border-foreground bg-muted/40' : 'border-muted-foreground/40 bg-muted/20'
                    }`}
                >
                    <input {...dropzone.getInputProps()} />
                    <div className="flex items-start gap-3">
                        <UploadCloud className="mt-0.5 h-4.5 w-4.5 text-muted-foreground" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">
                                {data.file ? data.file.name : 'Drag and drop a file here, or click to browse'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Supports documents, screenshots, and supporting files.
                            </p>
                            {data.file ? (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-xs"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setData('file', null);
                                    }}
                                >
                                    <X className="mr-1 h-3 w-3" />
                                    Remove file
                                </Button>
                            ) : null}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Evidence URL</Label>
                    <div className="relative">
                        <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="pl-9"
                            value={data.url}
                            onChange={(event) => setData('url', event.target.value)}
                            placeholder="https://example.com/evidence"
                        />
                    </div>
                </div>
            )}

            <Input value={data.notes} onChange={(event) => setData('notes', event.target.value)} placeholder="Short note" />

            <div className="flex gap-2">
                <Button type="button" size="sm" onClick={submit} disabled={processing}>
                    Save
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                    Cancel
                </Button>
            </div>
        </div>
    );
}
