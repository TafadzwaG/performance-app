import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';

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
                Add evidence
            </Button>
        );
    }

    return (
        <div className="space-y-2 rounded-lg border p-3">
            <div className="flex gap-2">
                <Button type="button" variant={data.evidence_type === 'file' ? 'default' : 'outline'} size="sm" onClick={() => setData('evidence_type', 'file')}>
                    File
                </Button>
                <Button type="button" variant={data.evidence_type === 'link' ? 'default' : 'outline'} size="sm" onClick={() => setData('evidence_type', 'link')}>
                    Link
                </Button>
            </div>
            {data.evidence_type === 'file' ? (
                <Input type="file" onChange={(event) => setData('file', event.target.files?.[0] ?? null)} />
            ) : (
                <Input value={data.url} onChange={(event) => setData('url', event.target.value)} placeholder="https://example.com/evidence" />
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
