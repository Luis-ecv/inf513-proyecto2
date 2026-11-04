<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documento_evidencia', function (Blueprint $table) {
            $table->id();
            $table->string('codigo_norma', 80)->unique();
            $table->string('titulo', 200);
            $table->string('tipo_documento', 60);
            $table->string('organo_emisor', 120);
            $table->date('fecha_emision');
            $table->string('archivo_ruta', 500);
            $table->boolean('vigente')->default(true);
            $table->foreignId('id_documento_padre')->nullable()->constrained('documento_evidencia')->cascadeOnUpdate()->nullOnDelete();
            $table->timestamps();

            $table->index(['tipo_documento', 'organo_emisor', 'fecha_emision']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documento_evidencia');
    }
};

