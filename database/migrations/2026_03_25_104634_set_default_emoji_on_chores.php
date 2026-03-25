<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Set default emoji for existing chores without one
        DB::table('chores')->whereNull('emoji')->update(['emoji' => '🧹']);

        // Set column default for new chores
        Schema::table('chores', function (Blueprint $table) {
            $table->string('emoji')->default('🧹')->change();
        });
    }

    public function down(): void
    {
        Schema::table('chores', function (Blueprint $table) {
            $table->string('emoji')->nullable()->default(null)->change();
        });
    }
};
