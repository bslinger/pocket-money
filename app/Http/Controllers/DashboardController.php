<?php

namespace App\Http\Controllers;

use App\Models\ChoreCompletion;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        abort_if($user === null, 401);

        $isParent     = $user->isParent();
        $hasSpenders  = $user->spenderUsers()->exists();
        $showAsParent = $isParent || !$hasSpenders;

        if ($showAsParent) {
            $families = $user->families()
                ->with(['spenders.accounts', 'spenders.savingsGoals'])
                ->get();

            $familyIds = $families->pluck('id');

            $pendingCompletions = ChoreCompletion::where('status', 'pending')
                ->whereHas('chore', fn($q) => $q->whereIn('family_id', $familyIds))
                ->with(['chore', 'spender'])
                ->latest('completed_at')
                ->limit(20)
                ->get();

            $recentActivity = Transaction::whereHas('account.spender',
                fn($q) => $q->whereIn('family_id', $familyIds))
                ->with('account.spender.family')
                ->latest('occurred_at')
                ->limit(15)
                ->get();

            $totalBalance = $families->flatMap(fn($f) => $f->spenders)
                ->flatMap(fn($s) => $s->accounts->where('is_savings_pot', false))
                ->sum('balance');

            $paidThisMonth = Transaction::whereHas('account.spender',
                fn($q) => $q->whereIn('family_id', $familyIds))
                ->where('type', 'credit')
                ->where('occurred_at', '>=', now()->startOfMonth())
                ->sum('amount');

            return Inertia::render('Dashboard', [
                'isParent'           => true,
                'families'           => $families,
                'spenders'           => [],
                'pendingCompletions' => $pendingCompletions,
                'recentActivity'     => $recentActivity,
                'totalBalance'       => number_format((float) $totalBalance, 2, '.', ''),
                'paidThisMonth'      => number_format((float) $paidThisMonth, 2, '.', ''),
            ]);
        }

        $spenders = $user->spenders()->with([
            'accounts',
            'savingsGoals',
            'family',
            'chores' => fn($q) => $q->where('is_active', true),
            'choreCompletions' => fn($q) => $q->whereBetween('completed_at', [
                now()->startOfWeek(),
                now()->endOfWeek(),
            ]),
        ])->get();

        return Inertia::render('Dashboard', [
            'isParent'           => false,
            'families'           => [],
            'spenders'           => $spenders,
            'pendingCompletions' => [],
            'recentActivity'     => [],
            'totalBalance'       => '0.00',
            'paidThisMonth'      => '0.00',
        ]);
    }
}
