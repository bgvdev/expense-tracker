<?php

use App\Models\PaymentMethod;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expense', function (Blueprint $table) {
            $table->foreignId('payment_method_id')
                ->nullable()
                ->after('description')
                ->constrained('payment_method')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('expense', function (Blueprint $table) {
            $table->dropForeignIdFor(PaymentMethod::class);
            $table->dropColumn('payment_method_id');
        });
    }
};
