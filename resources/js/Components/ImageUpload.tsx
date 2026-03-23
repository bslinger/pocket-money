import { useCallback, useRef, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { ImageIcon, Loader2, X, ZoomIn } from 'lucide-react';
import { Button } from '@/Components/ui/button';

interface Props {
    currentUrl?: string | null;
    onUpload: (key: string) => void;
    onClear?: () => void;
    label?: string;
    /** Crop aspect ratio — e.g. 1 for square, 16/9 for wide. Omit for free-form. */
    aspect?: number;
}

// ── Canvas crop helper ────────────────────────────────────────────────────────

function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.addEventListener('load', () => resolve(img));
        img.addEventListener('error', reject);
        img.setAttribute('crossOrigin', 'anonymous');
        img.src = url;
    });
}

async function cropImageToBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(
        image,
        pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
        0, 0, pixelCrop.width, pixelCrop.height,
    );
    return new Promise((resolve, reject) =>
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Canvas empty')), 'image/jpeg', 0.92),
    );
}

// ── Crop modal ────────────────────────────────────────────────────────────────

function CropModal({
    src,
    aspect,
    onDone,
    onCancel,
}: {
    src: string;
    aspect?: number;
    onDone: (croppedArea: Area) => void;
    onCancel: () => void;
}) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const onCropComplete = useCallback((_: Area, pixels: Area) => {
        setCroppedAreaPixels(pixels);
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-bark-200">
                    <h3 className="font-semibold text-bark-700 text-sm">Crop photo</h3>
                </div>

                {/* Cropper area */}
                <div className="relative" style={{ height: 320 }}>
                    <Cropper
                        image={src}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                        cropShape={aspect === 1 ? 'round' : 'rect'}
                        style={{
                            containerStyle: { background: '#f5f5f4' },
                            cropAreaStyle: { border: '2px solid #2D6A4F' },
                        }}
                    />
                </div>

                {/* Controls */}
                <div className="px-4 pt-3 pb-4 space-y-3 border-t border-bark-200">
                    {/* Zoom slider */}
                    <div className="flex items-center gap-3">
                        <ZoomIn className="h-4 w-4 text-bark-400 shrink-0" />
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.01}
                            value={zoom}
                            onChange={e => setZoom(Number(e.target.value))}
                            className="flex-1 accent-eucalyptus-400"
                            aria-label="Zoom"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 bg-eucalyptus-400 hover:bg-eucalyptus-500 text-white"
                            onClick={() => croppedAreaPixels && onDone(croppedAreaPixels)}
                            disabled={!croppedAreaPixels}
                        >
                            Use photo
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ImageUpload({ currentUrl, onUpload, onClear, label = 'Upload image', aspect }: Props) {
    const isSquare = aspect === 1;
    const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
    const [rawSrc, setRawSrc] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    async function uploadBlob(blob: Blob, filename = 'image.jpg') {
        setUploading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('file', blob, filename);
            const res = await fetch(route('uploads.store'), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                },
                body: formData,
            });
            if (!res.ok) throw new Error('Upload failed');
            const { key } = await res.json();
            setPreview(URL.createObjectURL(blob));
            onUpload(key);
        } catch {
            setError('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    }

    async function handleCropDone(pixelCrop: Area) {
        if (!rawSrc) return;
        setRawSrc(null);
        const blob = await cropImageToBlob(rawSrc, pixelCrop);
        await uploadBlob(blob);
    }

    function handleCropCancel() {
        setRawSrc(null);
        if (inputRef.current) inputRef.current.value = '';
    }

    function openForCrop(src: string) {
        setRawSrc(src);
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const objectUrl = URL.createObjectURL(file);
        openForCrop(objectUrl);
    }

    function clear() {
        setPreview(null);
        if (inputRef.current) inputRef.current.value = '';
        onClear?.();
    }

    return (
        <>
            {/* Crop modal — rendered outside normal flow so it covers everything */}
            {rawSrc && (
                <CropModal
                    src={rawSrc}
                    aspect={aspect}
                    onDone={handleCropDone}
                    onCancel={handleCropCancel}
                />
            )}

            <div className="space-y-2">
                {preview ? (
                    <div className={`relative ${isSquare ? 'w-32' : ''}`}>
                        <img
                            src={preview}
                            alt="Preview"
                            className={`object-cover border border-bark-200 ${
                                isSquare ? 'w-32 h-32 rounded-full' : 'w-full h-48 rounded-lg'
                            }`}
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
                        onDrop={e => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file?.type.startsWith('image/')) { openForCrop(URL.createObjectURL(file)); } }}
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
                    onChange={handleFileChange}
                />

                {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
        </>
    );
}
