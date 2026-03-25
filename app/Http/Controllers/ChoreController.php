<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreChoreRequest;
use App\Models\Chore;
use App\Models\ChoreCompletion;
use App\Services\AnalyticsService;
use Bentonow\BentoLaravel\DataTransferObjects\EventData;
use Bentonow\BentoLaravel\Facades\Bento;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ChoreController extends Controller
{
    public function index(Request $request)
    {
        $families = $request->user()
            ->families()
            ->when($this->activeFamilyId(), fn ($q, $id) => $q->where('families.id', $id))
            ->with(['chores.spenders', 'spenders'])
            ->get();

        $choreIds = $families->flatMap(fn ($f) => $f->chores)->pluck('id');

        $weekCompletions = ChoreCompletion::whereIn('chore_id', $choreIds)
            ->whereBetween('completed_at', [now()->subDay()->startOfDay(), now()->addDays(6)->endOfDay()])
            ->select(['id', 'chore_id', 'spender_id', 'status', 'completed_at'])
            ->get();

        $pendingCompletions = ChoreCompletion::where('status', 'pending')
            ->whereIn('chore_id', $choreIds)
            ->with(['chore', 'spender'])
            ->latest('completed_at')
            ->get();

        return Inertia::render('Chores/Index', [
            'families' => $families,
            'weekCompletions' => $weekCompletions,
            'pendingCompletions' => $pendingCompletions,
        ]);
    }

    public function create(Request $request)
    {
        $families = $request->user()->families()
            ->when($this->activeFamilyId(), fn ($q, $id) => $q->where('families.id', $id))
            ->with('spenders')->get();
        $spenders = $families->flatMap(fn ($f) => $f->spenders)->values();

        return Inertia::render('Chores/Create', [
            'families' => $families,
            'spenders' => $spenders,
        ]);
    }

    public function store(StoreChoreRequest $request)
    {
        $data = $request->validated();
        $spenderIds = $data['spender_ids'];
        unset($data['spender_ids']);

        $chore = Chore::create(array_merge($data, ['created_by' => $request->user()->id]));
        $chore->spenders()->sync($spenderIds);

        rescue(function () use ($request, $chore): void {
            Bento::trackEvent(collect([
                new EventData(
                    type: '$created_chore',
                    email: $request->user()->email,
                    fields: ['chore_name' => $chore->name],
                ),
            ]));
        });

        rescue(fn () => app(AnalyticsService::class)->crudEvent($request->user(), 'chore', 'created'));

        return redirect()->route('chores.index');
    }

    public function edit(Chore $chore)
    {
        $chore->load('spenders');
        $families = auth()->user()->families()
            ->when($this->activeFamilyId(), fn ($q, $id) => $q->where('families.id', $id))
            ->with('spenders')->get();
        $spenders = $families->flatMap(fn ($f) => $f->spenders)->values();

        return Inertia::render('Chores/Edit', [
            'chore' => $chore,
            'families' => $families,
            'spenders' => $spenders,
        ]);
    }

    public function update(StoreChoreRequest $request, Chore $chore)
    {
        $data = $request->validated();
        $spenderIds = $data['spender_ids'];
        unset($data['spender_ids']);

        $chore->update($data);
        $chore->spenders()->sync($spenderIds);

        rescue(fn () => app(AnalyticsService::class)->crudEvent($request->user(), 'chore', 'updated'));

        return redirect()->route('chores.index');
    }

    public function history(Chore $chore)
    {
        $chore->load('spenders');

        $completions = $chore->completions()
            ->with('spender')
            ->orderByDesc('completed_at')
            ->paginate(30);

        return Inertia::render('Chores/History', [
            'chore' => $chore,
            'completions' => $completions,
        ]);
    }

    public function destroy(Chore $chore)
    {
        $chore->delete();

        rescue(fn () => app(AnalyticsService::class)->crudEvent(auth()->user(), 'chore', 'deleted'));

        return redirect()->route('chores.index');
    }

    /**
     * Return completions for a specific date (JSON endpoint for lazy-loading past days).
     */
    public function completionsForDate(Request $request)
    {
        $request->validate(['date' => 'required|date']);

        $date = Carbon::parse($request->input('date'));

        $choreIds = $request->user()
            ->families()
            ->when($this->activeFamilyId(), fn ($q, $id) => $q->where('families.id', $id))
            ->with('chores')
            ->get()
            ->flatMap(fn ($f) => $f->chores)
            ->pluck('id');

        $completions = ChoreCompletion::whereIn('chore_id', $choreIds)
            ->whereBetween('completed_at', [$date->copy()->startOfDay(), $date->copy()->endOfDay()])
            ->select(['id', 'chore_id', 'spender_id', 'status', 'completed_at'])
            ->get();

        return response()->json($completions);
    }
}
