<?php

use App\Http\Middleware\EnsureFamilyMember;
use App\Models\Family;
use App\Models\FamilyUser;
use App\Models\User;
use App\Enums\FamilyRole;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Routing\Route;

describe('EnsureFamilyMember middleware', function () {

    it('allows a family member through', function () {
        [$user, $family] = parentWithFamily();

        $request = Request::create('/test');
        $request->setUserResolver(fn() => $user);

        // Bind family to the route parameter as the middleware expects
        $route = new Route('GET', '/test', []);
        $route->bind($request);
        $route->setParameter('family', $family);
        $request->setRouteResolver(fn() => $route);

        $called = false;
        $next = function () use (&$called) {
            $called = true;
            return new Response('ok');
        };

        (new EnsureFamilyMember())->handle($request, $next);

        expect($called)->toBeTrue();
    });

    it('returns 403 for a user who is not a family member', function () {
        [, $family] = parentWithFamily();
        $outsider = User::factory()->create();

        $request = Request::create('/test');
        $request->setUserResolver(fn() => $outsider);

        $route = new Route('GET', '/test', []);
        $route->bind($request);
        $route->setParameter('family', $family);
        $request->setRouteResolver(fn() => $route);

        expect(fn() => (new EnsureFamilyMember())->handle($request, fn() => new Response('ok')))
            ->toThrow(\Symfony\Component\HttpKernel\Exception\HttpException::class);
    });

    it('passes through when no family route parameter is present', function () {
        $user = User::factory()->create();

        $request = Request::create('/test');
        $request->setUserResolver(fn() => $user);

        $route = new Route('GET', '/test', []);
        $route->bind($request);
        $request->setRouteResolver(fn() => $route);

        $called = false;
        $next = function () use (&$called) {
            $called = true;
            return new Response('ok');
        };

        (new EnsureFamilyMember())->handle($request, $next);

        expect($called)->toBeTrue();
    });
});
