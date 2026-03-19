<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Services\SpenderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PocketMoneyReleaseController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $familyIds = $user->families()->pluck('families.id');

        $spenders = \App\Models\Spender::whereIn('family_id', $familyIds)
            ->with([
                'accounts.recurringTransactions' => fn($q) => $q->where('type', 'credit')->where('is_active', true),
                'chores'                         => fn($q) => $q->where('reward_type', 'responsibility')->where('is_active', true),
                'choreCompletions'               => fn($q) => $q->whereBetween('completed_at', [
                    now()->startOfWeek(),
                    now()->endOfWeek(),
                ]),
            ])
            ->get();

        $spenderData = $spenders->map(function ($spender) {
            $weeklyAmount = $spender->accounts->flatMap->recurringTransactions
                ->where('frequency', 'weekly')
                ->sum('amount');

            $responsibilityChores     = $spender->chores->where('reward_type', 'responsibility');
            $responsibilityChoreDone  = $spender->choreCompletions
                ->whereIn('chore_id', $responsibilityChores->pluck('id'))
                ->whereIn('status', ['approved', 'pending'])
                ->unique('chore_id')
                ->count();

            return [
                'spender'                       => $spender,
                'weekly_amount'                 => number_format((float) $weeklyAmount, 2, '.', ''),
                'responsibility_chores_total'   => $responsibilityChores->count(),
                'responsibility_chores_done'    => $responsibilityChoreDone,
            ];
        });

        return Inertia::render('PocketMoney/Release', [
            'spenders' => $spenderData->values(),
        ]);
    }

    public function pay(Request $request)
    {
        $request->validate([
            'spender_id' => ['required', 'uuid', 'exists:spenders,id'],
            'amount'     => ['required', 'numeric', 'min:0.01'],
        ]);

        $spender = \App\Models\Spender::findOrFail($request->input('spender_id'));

        DB::transaction(function () use ($spender, $request) {
            $account = SpenderService::mainAccount($spender);
            Transaction::create([
                'account_id'  => $account->id,
                'type'        => 'credit',
                'amount'      => $request->input('amount'),
                'description' => 'Pocket money',
                'occurred_at' => now(),
                'created_by'  => auth()->id(),
            ]);
            $account->increment('balance', $request->input('amount'));
        });

        return back()->with('success', 'Pocket money paid!');
    }
}
