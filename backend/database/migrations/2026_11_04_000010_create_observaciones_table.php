<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('observacion', function (Blueprint $table) {
            $table->id();
            $table->text('comentario');
            $table->text('respuesta_delegado')->nullable();
            $table->timestamp('fecha_respuesta')->nullable();
            $table->boolean('resuelta')->default(false);
            $table->timestamp('fecha_cierre')->nullable();
            $table->foreignId('id_capitulo')->constrained('capitulo')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('id_usuario_observador')->constrained('usuario')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('id_usuario_respuesta')->nullable()->constrained('usuario')->cascadeOnUpdate()->nullOnDelete();
            $table->timestamps();

            $table->index(['id_capitulo', 'resuelta']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('observacion');
    }
};

