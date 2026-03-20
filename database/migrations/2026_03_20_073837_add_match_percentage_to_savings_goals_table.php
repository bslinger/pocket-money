<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('savings_goals', function (Blueprint $table) {
            // null = no matching; 1-100 = percentage the parent will match on contributions
            $table->unsignedTinyInteger('match_percentage')->nullable()->after('is_completed');
        });
    }

    public function down(): void
    {
        Schema::table('savings_goals', function (Blueprint $table) {
            $table->dropColumn('match_percentage');
        });
    }
};
