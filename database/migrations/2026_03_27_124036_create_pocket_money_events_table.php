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
        Schema::create('pocket_money_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('spender_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('schedule_id')->nullable()->constrained('pocket_money_schedules')->nullOnDelete();
            $table->date('scheduled_for');
            $table->decimal('amount', 10, 2);
            $table->string('status'); // released | withheld
            $table->foreignUuid('transaction_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->index(['spender_id', 'scheduled_for']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pocket_money_events');
    }
};
