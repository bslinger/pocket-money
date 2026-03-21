<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->string('currency_name')->nullable()->after('balance');
            $table->string('currency_name_plural')->nullable()->after('currency_name');
            $table->string('currency_symbol')->nullable()->after('currency_name_plural');
            $table->boolean('use_integer_amounts')->nullable()->after('currency_symbol');
        });
    }

    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropColumn(['currency_name', 'currency_name_plural', 'currency_symbol', 'use_integer_amounts']);
        });
    }
};
