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
        Schema::dropIfExists('chore_chore_reward');
        Schema::dropIfExists('chore_rewards');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
