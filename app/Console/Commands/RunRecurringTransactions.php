<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\RecurringTransaction;
use App\Models\RecurringTransactionSkip;
use App\Models\Transaction;
use App\Enums\TxType;
use App\Enums\Frequency;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RunRecurringTransactions extends Command
{
    protected $signature = 'recurring:run';
    protected $description = 'Process all due recurring transactions';

    public function handle(): void
    {
        $due = RecurringTransaction::query()
            ->where('is_active', true)
            ->where('next_run_at', '<=', now())
            ->with('account')
            ->get();

        $this->info("Processing {$due->count()} due recurring transactions...");

        foreach ($due as $recurring) {
            $today = $recurring->next_run_at->toDateString();

            // Check for skip
            $isSkipped = RecurringTransactionSkip::where('recurring_transaction_id', $recurring->id)
                ->whereDate('skipped_date', $today)
                ->exists();

            if (!$isSkipped) {
                DB::transaction(function () use ($recurring) {
                    // Create transaction
                    Transaction::create([
                        'account_id'  => $recurring->account_id,
                        'type'        => $recurring->type,
                        'amount'      => $recurring->amount,
                        'description' => $recurring->description,
                        'occurred_at' => $recurring->next_run_at,
                        'created_by'  => $recurring->created_by,
                    ]);

                    // Update balance
                    $delta = $recurring->type === TxType::Credit
                        ? $recurring->amount
                        : -$recurring->amount;

                    $recurring->account->increment('balance', $delta);
                });
            }

            // Advance next_run_at
            $recurring->next_run_at = $this->advanceDate($recurring->next_run_at, $recurring->frequency);
            $recurring->save();

            $this->line("  - Processed #{$recurring->id} ({$recurring->description})");
        }

        $this->info('Done.');
    }

    private function advanceDate(Carbon $from, Frequency $frequency): Carbon
    {
        return match ($frequency) {
            Frequency::Daily       => $from->addDay(),
            Frequency::Weekly      => $from->addWeek(),
            Frequency::Fortnightly => $from->addWeeks(2),
            Frequency::Monthly     => $from->addMonth(),
            Frequency::Yearly      => $from->addYear(),
        };
    }
}
