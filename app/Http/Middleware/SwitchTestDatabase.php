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

            $database = ($workerIndex !== null && ctype_digit((string) $workerIndex))
                ? "pocket_money_test_{$workerIndex}"
                : env('DB_DATABASE', 'pocket_money');

            config(['database.connections.pgsql.database' => $database]);
            DB::purge('pgsql');
        }

        return $next($request);
    }
}
