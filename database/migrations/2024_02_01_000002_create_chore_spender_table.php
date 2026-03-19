<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chore_spender', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('chore_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('spender_id')->constrained()->cascadeOnDelete();
            $table->unique(['chore_id', 'spender_id']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chore_spender');
    }
};
