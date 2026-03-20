<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('spenders', function (Blueprint $table) {
            $table->string('currency_name')->nullable()->after('color');
            $table->string('currency_symbol')->nullable()->after('currency_name');
        });
    }

    public function down(): void
    {
        Schema::table('spenders', function (Blueprint $table) {
            $table->dropColumn(['currency_name', 'currency_symbol']);
        });
    }
};
