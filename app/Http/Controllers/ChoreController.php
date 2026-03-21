<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreChoreRequest;
use App\Models\Chore;
use Bentonow\BentoLaravel\DataTransferObjects\EventData;
use Bentonow\BentoLaravel\Facades\Bento;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ChoreController extends Controller
{
    public function index(Request $request)
    {
        $families = $request->user()
            ->families()
            ->when($this->activeFamilyId(), fn($q, $id) => $q->where('families.id', $id))
            ->with(['chores.spenders', 'spenders'])
            ->get();

        return Inertia::render('Chores/Index', [
            'families' => $families,
        ]);
    }

    public function create(Request $request)
    {
        $families  = $request->user()->families()
            ->when($this->activeFamilyId(), fn($q, $id) => $q->where('families.id', $id))
            ->with('spenders')->get();
        $spenders  = $families->flatMap(fn($f) => $f->spenders)->values();

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

        return redirect()->route('chores.index');
    }

    public function edit(Chore $chore)
    {
        $chore->load('spenders');
        $families = auth()->user()->families()
            ->when($this->activeFamilyId(), fn($q, $id) => $q->where('families.id', $id))
            ->with('spenders')->get();
        $spenders = $families->flatMap(fn($f) => $f->spenders)->values();

        return Inertia::render('Chores/Edit', [
            'chore'    => $chore,
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
            'chore'       => $chore,
            'completions' => $completions,
        ]);
    }

    public function destroy(Chore $chore)
    {
        $chore->delete();
        return redirect()->route('chores.index');
    }
}
