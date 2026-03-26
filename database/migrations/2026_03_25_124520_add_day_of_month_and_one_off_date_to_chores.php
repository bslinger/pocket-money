<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chores', function (Blueprint $table) {
            $table->unsignedTinyInteger('day_of_month')->nullable()->after('days_of_week');
            $table->date('one_off_date')->nullable()->after('day_of_month');
        });
    }

    public function down(): void
    {
        Schema::table('chores', function (Blueprint $table) {
            $table->dropColumn(['day_of_month', 'one_off_date']);
        });
    }
};
