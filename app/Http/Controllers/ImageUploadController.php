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
     * Generate a signed temporary URL for the given storage key.
     * Works for both local (serve => true requires signature) and S3 disks.
     */
    public static function url(?string $key): ?string
    {
        if ($key === null) {
            return null;
        }

        return Storage::disk('images')->temporaryUrl($key, now()->addMinutes(60));
    }
}
