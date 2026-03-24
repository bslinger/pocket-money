<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('push_tokens', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('tokenable_type');
            $table->uuid('tokenable_id');
            $table->string('token')->unique();
            $table->string('platform', 10); // ios or android
            $table->timestamps();

            $table->index(['tokenable_type', 'tokenable_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('push_tokens');
    }
};
