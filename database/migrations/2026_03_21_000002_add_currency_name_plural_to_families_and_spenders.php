<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('families', function (Blueprint $table) {
            $table->string('currency_name_plural', 50)->nullable()->after('currency_name');
        });

        Schema::table('spenders', function (Blueprint $table) {
            $table->string('currency_name_plural', 50)->nullable()->after('currency_name');
        });
    }

    public function down(): void
    {
        Schema::table('families', function (Blueprint $table) {
            $table->dropColumn('currency_name_plural');
        });

        Schema::table('spenders', function (Blueprint $table) {
            $table->dropColumn('currency_name_plural');
        });
    }
};
