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
        Schema::create('pocket_money_schedules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('spender_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->enum('frequency', ['weekly', 'monthly']);
            $table->tinyInteger('day_of_week')->nullable()->comment('0=Mon…6=Sun; used when frequency=weekly');
            $table->tinyInteger('day_of_month')->nullable()->comment('1–31; used when frequency=monthly');
            $table->boolean('is_active')->default(true);
            $table->timestamp('next_run_at')->nullable();
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pocket_money_schedules');
    }
};
