import { useRef, useState } from 'react';
import { ImageIcon, Loader2, X } from 'lucide-react';

interface Props {
    currentUrl?: string | null;
    onUpload: (key: string) => void;
    onClear?: () => void;
    label?: string;
}

/**
 * Image upload component.
 * POSTs the file to the backend, which stores it on the configured disk.
 * Calls onUpload(key) so the parent form can store the storage key.
 */
export default function ImageUpload({ currentUrl, onUpload, onClear, label = 'Upload image' }: Props) {
    const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    async function handleFile(file: File) {
        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch(route('uploads.store'), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                },
                body: formData,
            });

            if (!res.ok) throw new Error('Upload failed');

            const { key } = await res.json();

            setPreview(URL.createObjectURL(file));
            onUpload(key);
        } catch (e) {
            setError('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file?.type.startsWith('image/')) handleFile(file);
    }

    function clear() {
        setPreview(null);
        if (inputRef.current) inputRef.current.value = '';
        onClear?.();
    }

    return (
        <div className="space-y-2">
            {preview ? (
                <div className="relative">
                    <img
                        src={preview}
                        alt="Cover"
                        className="w-full h-48 object-cover rounded-lg border border-border"
                    />
                    {onClear && (
                        <button
                            type="button"
                            onClick={clear}
                            className="absolute top-2 right-2 h-6 w-6 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Remove image"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="absolute bottom-2 right-2 text-xs bg-background/80 backdrop-blur px-2 py-1 rounded-md border border-border hover:bg-background transition-colors"
                    >
                        Change
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={e => e.preventDefault()}
                    className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
                    disabled={uploading}
                >
                    {uploading
                        ? <Loader2 className="h-5 w-5 animate-spin" />
                        : <ImageIcon className="h-5 w-5" />
                    }
                    <span className="text-sm">{uploading ? 'Uploading…' : label}</span>
                </button>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleChange}
            />

            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
