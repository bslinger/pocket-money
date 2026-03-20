<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SwitchTestDatabase
{
    public function handle(Request $request, Closure $next): mixed
    {
        if (app()->isLocal()) {
            $workerIndex = $request->header('X-Test-DB');

            if ($workerIndex !== null && ctype_digit((string) $workerIndex)) {
                config(['database.connections.pgsql.database' => "pocket_money_test_{$workerIndex}"]);
                DB::purge('pgsql');
            }
        }

        return $next($request);
    }
}
