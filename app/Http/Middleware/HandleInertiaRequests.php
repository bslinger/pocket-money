<?php

namespace App\Http\Middleware;

use App\Models\Family;
use App\Models\Spender;
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
            'flash' => [
                'linkCode' => fn () => $request->session()->get('linkCode'),
            ],
            'auth' => [
                'user' => $request->user(),
                'isParent' => $request->user()?->isParent() ?? false,
                'activeFamily' => $this->resolveActiveFamily($request),
                'userFamilies' => fn () => $request->user()?->isParent()
                    ? $request->user()->families()->select(['families.id', 'families.name'])->get()
                    : [],
                'viewingAsSpender' => $this->resolveViewingAsSpender($request),
                'subscription' => fn () => $this->resolveSubscriptionStatus($request),
            ],
        ];
    }

    /**
     * Resolve the spender being previewed in child-view mode (parents only).
     *
     * @return array<string, mixed>|null
     */
    private function resolveViewingAsSpender(Request $request): ?array
    {
        $user = $request->user();
        if (! $user || ! $user->isParent()) {
            return null;
        }

        $spenderId = $request->session()->get('viewing_as_spender_id');
        if (! $spenderId) {
            return null;
        }

        $spender = Spender::find($spenderId);

        return $spender ? ['id' => $spender->id, 'name' => $spender->name] : null;
    }

    /**
     * Resolve subscription/trial status for the active family.
     *
     * @return array<string, mixed>|null
     */
    private function resolveSubscriptionStatus(Request $request): ?array
    {
        $user = $request->user();
        if (! $user || ! $user->isParent()) {
            return null;
        }

        $familyId = session('active_family_id');
        $family = $familyId ? Family::find($familyId) : $user->families()->first();

        if (! $family) {
            return null;
        }

        $onTrial = $family->onTrial();
        $subscribed = $family->subscribed('default');

        return [
            'active' => $family->hasActiveAccess(),
            'on_trial' => $onTrial,
            'trial_ends_at' => $onTrial ? $family->trial_ends_at->toIso8601String() : null,
            'subscribed' => $subscribed,
            'frozen' => ! $onTrial && ! $subscribed,
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
        if (! $user || ! $user->isParent()) {
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

        return $active->toArray();
    }
}
