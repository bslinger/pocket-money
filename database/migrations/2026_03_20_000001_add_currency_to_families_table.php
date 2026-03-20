<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('families', function (Blueprint $table) {
            $table->string('currency_name')->default('Dollar')->after('avatar_url');
            $table->string('currency_symbol')->default('$')->after('currency_name');
        });
    }

    public function down(): void
    {
        Schema::table('families', function (Blueprint $table) {
            $table->dropColumn(['currency_name', 'currency_symbol']);
        });
    }
};
