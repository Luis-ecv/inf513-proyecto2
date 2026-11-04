<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('componente', function (Blueprint $table) {
            $table->id();
            $table->smallInteger('numero');
            $table->string('nombre', 120);
            $table->text('descripcion')->nullable();
            $table->foreignId('id_plan_estudio')->constrained('plan_estudio')->cascadeOnUpdate()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['numero', 'id_plan_estudio']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('componente');
    }
};

