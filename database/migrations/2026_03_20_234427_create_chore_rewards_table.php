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
        Schema::create('chore_rewards', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('spender_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('description')->nullable();
            $table->date('payout_date')->nullable();
            $table->boolean('is_paid')->default(false);
            $table->timestamp('paid_at')->nullable();
            $table->foreignUuid('transaction_id')->nullable()->constrained('transactions')->nullOnDelete();
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestamps();
        });

        Schema::create('chore_chore_reward', function (Blueprint $table) {
            $table->foreignUuid('chore_reward_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('chore_id')->constrained()->cascadeOnDelete();
            $table->primary(['chore_reward_id', 'chore_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chore_chore_reward');
        Schema::dropIfExists('chore_rewards');
    }
};
