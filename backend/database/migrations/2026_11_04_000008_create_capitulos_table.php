<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('capitulo', function (Blueprint $table) {
            $table->id();
            $table->smallInteger('numero');
            $table->string('titulo', 150);
            $table->text('contenido')->nullable();
            $table->foreignId('id_componente')->constrained('componente')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('id_estado')->default(1)->constrained('estado_capitulo')->cascadeOnUpdate()->restrictOnDelete();
            $table->timestamps();

            $table->unique(['numero', 'id_componente']);
            $table->index('id_estado');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('capitulo');
    }
};

