<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user'        => $request->user(),
                'isParent'    => $request->user()?->isParent() ?? false,
                'activeFamily'  => $this->resolveActiveFamily($request),
                'userFamilies'  => fn() => $request->user()?->isParent()
                    ? $request->user()->families()->select(['families.id', 'families.name'])->get()
                    : [],
            ],
        ];
    }

    /**
     * Resolve the currently active family for the authenticated parent, defaulting to
     * their first family if none is stored in the session.
     *
     * @return array<string, mixed>|null
     */
    private function resolveActiveFamily(Request $request): ?array
    {
        $user = $request->user();
        if (!$user || !$user->isParent()) {
            return null;
        }

        $families = $user->families()
            ->select(['families.id', 'families.name', 'families.currency_name', 'families.currency_symbol'])
            ->withCount(['familyUsers as parents_count', 'spenders as kids_count'])
            ->get();

        if ($families->isEmpty()) {
            return null;
        }

        $activeFamilyId = session('active_family_id');
        $active = $activeFamilyId ? $families->firstWhere('id', $activeFamilyId) : null;
        $active ??= $families->first();

        if ($active->id !== $activeFamilyId) {
            session(['active_family_id' => $active->id]);
        }

        return $active->toArray();
    }
}
