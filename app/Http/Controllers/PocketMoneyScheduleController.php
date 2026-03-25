<?php

namespace App\Http\Controllers;

use App\Models\PocketMoneySchedule;
use App\Models\Spender;
use App\Services\AnalyticsService;
use Illuminate\Http\Request;

class PocketMoneyScheduleController extends Controller
{
    public function store(Request $request, Spender $spender)
    {
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'frequency' => ['required', 'in:weekly,monthly'],
            'day_of_week' => ['nullable', 'integer', 'min:0', 'max:6'],
            'day_of_month' => ['nullable', 'integer', 'min:1', 'max:31'],
            'account_id' => ['nullable', 'uuid', 'exists:accounts,id'],
        ]);

        // Deactivate any existing schedule for this spender
        PocketMoneySchedule::where('spender_id', $spender->id)
            ->where('is_active', true)
            ->update(['is_active' => false]);

        PocketMoneySchedule::create([
            'spender_id' => $spender->id,
            'account_id' => $data['account_id'] ?? null,
            'amount' => $data['amount'],
            'frequency' => $data['frequency'],
            'day_of_week' => $data['day_of_week'] ?? null,
            'day_of_month' => $data['day_of_month'] ?? null,
            'is_active' => true,
            'next_run_at' => PocketMoneySchedule::computeNextRunAt(
                $data['frequency'],
                $data['day_of_week'] ?? null,
                $data['day_of_month'] ?? null,
            ),
            'created_by' => $request->user()->id,
        ]);

        rescue(fn () => app(AnalyticsService::class)->crudEvent($request->user(), 'pocket_money_schedule', 'created'));

        return back()->with('success', 'Pocket money schedule saved.');
    }

    public function destroy(PocketMoneySchedule $schedule)
    {
        $schedule->update(['is_active' => false]);

        rescue(fn () => app(AnalyticsService::class)->crudEvent(auth()->user(), 'pocket_money_schedule', 'deleted'));

        return back()->with('success', 'Pocket money schedule cancelled.');
    }
}
