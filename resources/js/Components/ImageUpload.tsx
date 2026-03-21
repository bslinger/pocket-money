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
                        className="w-full h-48 object-cover rounded-lg border border-bark-200"
                    />
                    {onClear && (
                        <button
                            type="button"
                            onClick={clear}
                            className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-bark-500 hover:text-bark-700 transition-colors"
                            aria-label="Remove image"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="absolute bottom-2 right-2 text-xs bg-white/80 backdrop-blur px-2 py-1 rounded-md border border-bark-200 hover:bg-bark-50 transition-colors"
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
                    className="w-full h-32 border-2 border-dashed border-bark-200 rounded-lg flex flex-col items-center justify-center gap-2 text-bark-500 hover:border-eucalyptus-300 hover:text-bark-700 transition-colors"
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
