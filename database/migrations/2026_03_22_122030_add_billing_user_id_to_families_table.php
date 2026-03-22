<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('families', function (Blueprint $table) {
            $table->uuid('billing_user_id')->nullable()->after('name');
            $table->foreign('billing_user_id')->references('id')->on('users')->nullOnDelete();
        });

        // Backfill: set billing_user_id to the first admin of each family
        DB::table('families')
            ->whereNull('billing_user_id')
            ->get()
            ->each(function ($family) {
                $admin = DB::table('family_users')
                    ->where('family_id', $family->id)
                    ->where('role', 'admin')
                    ->orderBy('created_at')
                    ->first();

                if ($admin) {
                    DB::table('families')
                        ->where('id', $family->id)
                        ->update(['billing_user_id' => $admin->user_id]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('families', function (Blueprint $table) {
            $table->dropForeign(['billing_user_id']);
            $table->dropColumn('billing_user_id');
        });
    }
};
