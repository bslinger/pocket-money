<?php

namespace App\Http\Controllers;

use App\Models\PocketMoneySchedule;
use App\Models\Spender;
use Illuminate\Http\Request;

class PocketMoneyScheduleController extends Controller
{
    public function store(Request $request, Spender $spender)
    {
        $data = $request->validate([
            'amount'        => ['required', 'numeric', 'min:0.01'],
            'frequency'     => ['required', 'in:weekly,monthly'],
            'day_of_week'   => ['nullable', 'integer', 'min:0', 'max:6'],
            'day_of_month'  => ['nullable', 'integer', 'min:1', 'max:31'],
        ]);

        // Deactivate any existing schedule for this spender
        PocketMoneySchedule::where('spender_id', $spender->id)
            ->where('is_active', true)
            ->update(['is_active' => false]);

        PocketMoneySchedule::create([
            'spender_id'   => $spender->id,
            'amount'       => $data['amount'],
            'frequency'    => $data['frequency'],
            'day_of_week'  => $data['day_of_week'] ?? null,
            'day_of_month' => $data['day_of_month'] ?? null,
            'is_active'    => true,
            'next_run_at'  => PocketMoneySchedule::computeNextRunAt(
                $data['frequency'],
                $data['day_of_week'] ?? null,
                $data['day_of_month'] ?? null,
            ),
            'created_by'   => $request->user()->id,
        ]);

        return back()->with('success', 'Pocket money schedule saved.');
    }

    public function destroy(PocketMoneySchedule $schedule)
    {
        $schedule->update(['is_active' => false]);
        return back()->with('success', 'Pocket money schedule cancelled.');
    }
}
