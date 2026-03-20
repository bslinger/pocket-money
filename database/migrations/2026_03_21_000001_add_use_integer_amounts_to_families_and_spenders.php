<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('families', function (Blueprint $table) {
            $table->boolean('use_integer_amounts')->default(false)->after('currency_name');
        });

        Schema::table('spenders', function (Blueprint $table) {
            $table->boolean('use_integer_amounts')->nullable()->after('currency_name');
        });
    }

    public function down(): void
    {
        Schema::table('families', function (Blueprint $table) {
            $table->dropColumn('use_integer_amounts');
        });

        Schema::table('spenders', function (Blueprint $table) {
            $table->dropColumn('use_integer_amounts');
        });
    }
};
