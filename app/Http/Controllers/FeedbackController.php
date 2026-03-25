<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FeedbackController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'type' => ['required', 'in:Bug Report,Feature Request,General Feedback'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:5000'],
        ]);

        $user = $request->user();

        $childCount = 0;
        $family = $user->families()->first();
        if ($family) {
            $childCount = $family->spenders()->count();
        }

        $familySize = match (true) {
            $childCount >= 4 => '4+ children',
            $childCount >= 2 => '2-3 children',
            default => '1 child',
        };

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
                        'select' => ['name' => 'Web'],
                    ],
                    'App Version' => [
                        'rich_text' => [['text' => ['content' => 'web']]],
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

        return back()->with('success', 'Thank you for your feedback!');
    }
}
