import { execSync } from 'child_process';

export default async function globalSetup() {
    // Inside the Sail container LARAVEL_SAIL=1, so use php artisan directly.
    // Outside the container, delegate to sail which routes into Docker.
    const cmd = process.env.LARAVEL_SAIL
        ? 'php artisan migrate:fresh --seed --force'
        : './vendor/bin/sail artisan migrate:fresh --seed --force';

    execSync(cmd, { stdio: 'inherit', cwd: process.cwd() });
}
