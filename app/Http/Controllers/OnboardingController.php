<?php

namespace App\Http\Controllers;

use App\Enums\FamilyRole;
use App\Http\Requests\StoreFamilyRequest;
use App\Models\Account;
use App\Models\Chore;
use App\Models\Family;
use App\Models\FamilyUser;
use App\Models\PocketMoneySchedule;
use App\Models\Spender;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function show(): Response|RedirectResponse
    {
        $user = auth()->user();
        if ($user === null) {
            return redirect()->route('login');
        }

        // Already has a family — skip to the continuation wizard
        $family = $user->families()->with('spenders.accounts')->first();
        if ($family) {
            return redirect()->route('onboarding.continue', $family);
        }

        return Inertia::render('Onboarding/Index');
    }

    public function store(StoreFamilyRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $spendersData = $validated['spenders'] ?? [];
        unset($validated['spenders']);

        $family = Family::create($validated);
        FamilyUser::create([
            'family_id' => $family->id,
            'user_id'   => auth()->id(),
            'role'      => FamilyRole::Admin,
        ]);

        foreach ($spendersData as $spenderInput) {
            /** @var array{name: string, color?: string|null} $spenderInput */
            $spender = Spender::create([
                'family_id' => $family->id,
                'name'      => $spenderInput['name'],
                'color'     => $spenderInput['color'] ?? '#6366f1',
            ]);
            Account::create([
                'spender_id' => $spender->id,
                'name'       => 'Savings',
                'balance'    => 0,
            ]);
        }

        return redirect()->route('onboarding.continue', $family);
    }

    public function showContinue(Family $family): Response|RedirectResponse
    {
        /** @var \App\Models\User $user */
        $user = auth()->user();

        abort_unless(
            $user->families()->where('families.id', $family->id)->exists(),
            403
        );

        $family->load('spenders.accounts');

        return Inertia::render('Onboarding/Continue', [
            'family' => $family,
        ]);
    }

    public function storePocketMoney(Request $request, Family $family): RedirectResponse
    {
        /** @var \App\Models\User $user */
        $user = auth()->user();
        abort_unless($user->families()->where('families.id', $family->id)->exists(), 403);

        $validated = $request->validate([
            'schedules'                   => ['nullable', 'array'],
            'schedules.*.spender_id'      => ['required', 'uuid', 'exists:spenders,id'],
            'schedules.*.amount'          => ['required', 'numeric', 'min:0.01'],
            'schedules.*.frequency'       => ['required', 'in:weekly,monthly'],
            'schedules.*.day_of_week'     => ['nullable', 'integer', 'min:0', 'max:6'],
            'schedules.*.day_of_month'    => ['nullable', 'integer', 'min:1', 'max:28'],
        ]);

        foreach ($validated['schedules'] ?? [] as $schedule) {
            /** @var array{spender_id: string, amount: string|float, frequency: string, day_of_week?: int|null, day_of_month?: int|null} $schedule */
            PocketMoneySchedule::where('spender_id', $schedule['spender_id'])
                ->where('is_active', true)
                ->update(['is_active' => false]);

            PocketMoneySchedule::create([
                'spender_id'   => $schedule['spender_id'],
                'amount'       => $schedule['amount'],
                'frequency'    => $schedule['frequency'],
                'day_of_week'  => $schedule['day_of_week'] ?? null,
                'day_of_month' => $schedule['day_of_month'] ?? null,
                'is_active'    => true,
                'next_run_at'  => PocketMoneySchedule::computeNextRunAt(
                    $schedule['frequency'],
                    $schedule['day_of_week'] ?? null,
                    $schedule['day_of_month'] ?? null,
                ),
                'created_by'   => $user->id,
            ]);
        }

        return back();
    }

    public function storeChores(Request $request, Family $family): RedirectResponse
    {
        /** @var \App\Models\User $user */
        $user = auth()->user();
        abort_unless($user->families()->where('families.id', $family->id)->exists(), 403);

        $validated = $request->validate([
            'chores'                      => ['nullable', 'array'],
            'chores.*.name'               => ['required', 'string', 'max:255'],
            'chores.*.emoji'              => ['nullable', 'string', 'max:10'],
            'chores.*.reward_type'        => ['required', 'in:earns,responsibility,no_reward'],
            'chores.*.amount'             => ['required_if:chores.*.reward_type,earns', 'nullable', 'numeric', 'min:0.01'],
            'chores.*.frequency'          => ['required', 'in:daily,weekly,monthly,one_off'],
            'chores.*.spender_ids'        => ['required', 'array', 'min:1'],
            'chores.*.spender_ids.*'      => ['uuid', 'exists:spenders,id'],
        ]);

        foreach ($validated['chores'] ?? [] as $choreData) {
            /** @var array{name: string, emoji?: string|null, reward_type: string, amount?: string|float|null, frequency: string, spender_ids: string[]} $choreData */
            $spenderIds = $choreData['spender_ids'];
            unset($choreData['spender_ids']);

            $chore = Chore::create(array_merge($choreData, [
                'family_id'         => $family->id,
                'is_active'         => true,
                'requires_approval' => false,
                'up_for_grabs'      => false,
                'created_by'        => $user->id,
            ]));
            $chore->spenders()->sync($spenderIds);
        }

        return back();
    }
}
