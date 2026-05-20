import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UploadCloud, X } from 'lucide-react';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface CalibrationEvidenceDropzoneProps {
    files: File[];
    onChange: (files: File[]) => void;
    disabled?: boolean;
}

export default function CalibrationEvidenceDropzone({ files, onChange, disabled = false }: CalibrationEvidenceDropzoneProps) {
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (!acceptedFiles.length) {
                return;
            }

            onChange([...files, ...acceptedFiles]);
        },
        [files, onChange],
    );

    const dropzone = useDropzone({
        onDrop,
        multiple: true,
        maxSize: 10 * 1024 * 1024,
        disabled,
    });

    const removeFile = (index: number) => {
        onChange(files.filter((_, fileIndex) => fileIndex !== index));
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-medium">Evidence attachments</label>
                <Badge variant="outline">Max 10MB per file</Badge>
            </div>

            <div
                {...dropzone.getRootProps()}
                className={`cursor-pointer rounded-lg border border-dashed p-4 transition-colors ${
                    dropzone.isDragActive ? 'border-foreground bg-muted/40' : 'border-muted-foreground/40 bg-muted/20'
                } ${disabled ? 'pointer-events-none opacity-60' : ''}`}
            >
                <input {...dropzone.getInputProps()} />
                <div className="flex items-start gap-3">
                    <UploadCloud className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">Drag and drop files here, or click to browse</p>
                        <p className="text-xs text-muted-foreground">
                            Upload committee notes, moderation spreadsheets, or other supporting documents.
                        </p>
                    </div>
                </div>
            </div>

            {files.length > 0 ? (
                <ul className="space-y-2">
                    {files.map((file, index) => (
                        <li
                            key={`${file.name}-${file.size}-${index}`}
                            className="flex items-center justify-between gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm"
                        >
                            <span className="truncate">{file.name}</span>
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-7 shrink-0 px-2"
                                onClick={() => removeFile(index)}
                                disabled={disabled}
                            >
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    );
}
