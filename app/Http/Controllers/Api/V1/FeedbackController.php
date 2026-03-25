<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FeedbackController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', 'in:Bug Report,Feature Request,General Feedback'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:5000'],
            'platform' => ['required', 'in:iOS,Android,Web'],
            'app_version' => ['nullable', 'string', 'max:50'],
        ]);

        $user = $request->user();

        // Determine family size
        $childCount = 0;
        if ($user) {
            $family = $user->families()->first();
            if ($family) {
                $childCount = $family->spenders()->count();
            }
        }

        $familySize = match (true) {
            $childCount >= 4 => '4+ children',
            $childCount >= 2 => '2-3 children',
            default => '1 child',
        };

        // Post to Notion
        $databaseId = config('services.notion.feedback_database_id');
        $notionToken = config('services.notion.token');

        if ($databaseId && $notionToken) {
            rescue(fn () => Http::withHeaders([
                'Authorization' => "Bearer {$notionToken}",
                'Notion-Version' => '2022-06-28',
            ])->post('https://api.notion.com/v1/pages', [
                'parent' => ['database_id' => $databaseId],
                'properties' => [
                    'Title' => [
                        'title' => [['text' => ['content' => $data['title']]]],
                    ],
                    'Type' => [
                        'select' => ['name' => $data['type']],
                    ],
                    'Description' => [
                        'rich_text' => [['text' => ['content' => $data['description']]]],
                    ],
                    'Platform' => [
                        'select' => ['name' => $data['platform']],
                    ],
                    'App Version' => [
                        'rich_text' => [['text' => ['content' => $data['app_version'] ?? 'unknown']]],
                    ],
                    'Family Size' => [
                        'select' => ['name' => $familySize],
                    ],
                    'Status' => [
                        'select' => ['name' => 'New'],
                    ],
                ],
            ])->throw());
        } else {
            Log::warning('Feedback submitted but Notion not configured', $data);
        }

        return response()->json(['message' => 'Thank you for your feedback!'], 201);
    }
}
