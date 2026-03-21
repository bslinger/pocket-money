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
            $table->timestamp('completed_at')->nullable()->after('is_completed');
            $table->timestamp('abandoned_at')->nullable()->after('completed_at');
            $table->decimal('abandoned_allocated_amount', 10, 2)->nullable()->after('abandoned_at');
        });
    }

    public function down(): void
    {
        Schema::table('savings_goals', function (Blueprint $table) {
            $table->dropColumn(['completed_at', 'abandoned_at', 'abandoned_allocated_amount']);
        });
    }
};
