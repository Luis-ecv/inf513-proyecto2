<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plan_estudio', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 30)->unique();
            $table->string('carrera', 120);
            $table->integer('anio_vigencia');
            $table->text('descripcion')->nullable();
            $table->text('objetivos');
            $table->text('perfil_egreso');
            $table->integer('limite_creditos_min')->default(200);
            $table->integer('limite_creditos_max')->default(280);
            $table->string('estado', 30)->default('En Elaboración');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_estudio');
    }
};

