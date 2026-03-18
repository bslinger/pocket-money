<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $isParent = $user->isParent();
        $hasSpenders = $user->spenderUsers()->exists();

        // New users (no family and no spender links) are treated as parents for onboarding
        $showAsParent = $isParent || (!$isParent && !$hasSpenders);

        if ($showAsParent) {
            $families = $user->families()->with(['spenders.accounts'])->get();
            $spenders = [];
        } else {
            $families = [];
            $spenders = $user->spenders()->with(['accounts', 'family'])->get();
        }

        return Inertia::render('Dashboard', [
            'isParent' => $showAsParent,
            'families' => $families,
            'spenders' => $spenders,
        ]);
    }
}
