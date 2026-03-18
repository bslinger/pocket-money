<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recurring_transaction_skips', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('recurring_transaction_id')->constrained('recurring_transactions')->cascadeOnDelete();
            $table->date('skipped_date');
            $table->unique(['recurring_transaction_id', 'skipped_date']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recurring_transaction_skips');
    }
};
