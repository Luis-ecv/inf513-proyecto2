<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('version_capitulo', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_capitulo')->constrained('capitulo')->cascadeOnUpdate()->cascadeOnDelete();
            $table->integer('numero_version');
            $table->string('nombre_archivo', 255);
            $table->string('archivo_ruta', 255);
            $table->longText('contenido_texto');
            $table->text('resumen_cambio')->nullable();
            $table->foreignId('id_usuario')->constrained('usuario')->cascadeOnUpdate()->restrictOnDelete();
            $table->timestamps();

            $table->unique(['id_capitulo', 'numero_version']);
            $table->index('id_capitulo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('version_capitulo');
    }
};
