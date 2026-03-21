<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ImageUploadController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|image|max:5120',
        ]);

        $key = $request->file('file')->store(
            'uploads/'.auth()->id(),
            'images',
        );

        return response()->json([
            'key' => $key,
            'url' => self::url($key),
        ]);
    }

    /**
     * Generate a public URL for the given storage key.
     * Uses temporaryUrl on S3 (signed, 60-min expiry) or url() on local disk.
     */
    public static function url(?string $key): ?string
    {
        if ($key === null) {
            return null;
        }

        $disk = Storage::disk('images');

        $driver = $disk->getConfig()['driver'] ?? 'local';

        if ($driver === 'local') {
            return $disk->url($key);
        }

        return $disk->temporaryUrl($key, now()->addMinutes(60));
    }
}
