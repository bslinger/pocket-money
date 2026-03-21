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

            // Octane clones config from boot-state for each request, so reading
            // config() here always gives the original value from config/database.php.
            $default  = config('database.connections.pgsql.database', 'pocket_money');
            $database = ($workerIndex !== null && ctype_digit((string) $workerIndex))
                ? "pocket_money_test_{$workerIndex}"
                : $default;

            config(['database.connections.pgsql.database' => $database]);
            DB::purge('pgsql');
        }

        return $next($request);
    }
}
