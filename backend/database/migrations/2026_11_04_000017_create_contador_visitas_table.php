<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contador_visitas', function (Blueprint $table) {
            $table->id();
            $table->string('ruta_pagina', 150)->unique();
            $table->unsignedBigInteger('visitas')->default(0);
            $table->timestamp('ultima_visita')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contador_visitas');
    }
};

