<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index()
    {
        return Inertia::render('Settings/Index', [
            'user' => auth()->user(),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $validated = $request->validate([
            'display_name' => 'nullable|string|max:255',
            'parent_title' => 'nullable|string|max:100',
            'email'        => 'required|email|max:255|unique:users,email,' . auth()->id(),
            'avatar_url'   => 'nullable|url|max:255',
        ]);

        auth()->user()->update($validated);

        return redirect()->route('settings')->with('success', 'Profile updated.');
    }

    public function deleteAccount(Request $request)
    {
        $request->validate([
            'password' => 'required|current_password',
        ]);

        $user = auth()->user();
        auth()->logout();
        $user->delete();

        return redirect('/');
    }

    public function exportData(Request $request)
    {
        $user = auth()->user();

        $data = $user->families()->with([
            'users',
            'spenders.accounts.transactions',
            'spenders.savingsGoals',
        ])->get();

        return response()->json($data);
    }
}
