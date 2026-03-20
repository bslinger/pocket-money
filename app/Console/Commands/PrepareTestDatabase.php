<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use PDO;

class PrepareTestDatabase extends Command
{
    protected $signature = 'test:db:prepare {index : Worker index (0-based)}';
    protected $description = 'Create and migrate a per-worker test database for Playwright';

    public function handle(): int
    {
        if (! app()->isLocal()) {
            $this->error('This command may only run in the local environment.');
            return 1;
        }

        $index  = (int) $this->argument('index');
        $dbName = "pocket_money_test_{$index}";
        $cfg    = config('database.connections.pgsql');

        $dsn = sprintf('pgsql:host=%s;port=%d;dbname=postgres', $cfg['host'], $cfg['port']);
        $pdo = new PDO($dsn, $cfg['username'], $cfg['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

        $exists = (bool) $pdo->query("SELECT 1 FROM pg_database WHERE datname = '{$dbName}'")->fetchColumn();
        if (! $exists) {
            $pdo->exec("CREATE DATABASE \"{$dbName}\"");
            $this->info("Created database: {$dbName}");
        }

        config(['database.connections.pgsql.database' => $dbName]);
        DB::purge('pgsql');

        $this->call('migrate:fresh', ['--force' => true, '--seed' => true]);

        $this->info("Database {$dbName} ready.");
        return 0;
    }
}
