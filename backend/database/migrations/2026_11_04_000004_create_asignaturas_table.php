<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asignatura', function (Blueprint $table) {
            $table->id();
            $table->string('sigla', 15);
            $table->string('nombre', 120);
            $table->smallInteger('semestre');
            $table->smallInteger('horas_teoricas')->default(0);
            $table->smallInteger('horas_practicas')->default(0);
            $table->smallInteger('creditos');
            $table->string('area_formativa', 80);
            $table->foreignId('id_plan_estudio')->constrained('plan_estudio')->cascadeOnUpdate()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['sigla', 'id_plan_estudio']);
            $table->index(['id_plan_estudio', 'semestre']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asignatura');
    }
};

