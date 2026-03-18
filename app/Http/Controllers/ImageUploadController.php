<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageUploadController extends Controller
{
    public function sign(Request $request)
    {
        $request->validate([
            'filename' => 'required|string|max:255',
        ]);

        $key = 'uploads/' . auth()->id() . '/' . Str::uuid() . '/' . $request->filename;
        $url = Storage::temporaryUploadUrl($key, now()->addMinutes(5));

        return response()->json(['url' => $url, 'key' => $key]);
    }
}
