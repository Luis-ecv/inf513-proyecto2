<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('historial_modificacion', function (Blueprint $table) {
            $table->id();
            $table->string('estado_anterior', 50);
            $table->string('estado_nuevo', 50);
            $table->string('descripcion_accion', 255);
            $table->text('justificacion_tecnica');
            $table->timestamp('fecha_hora')->useCurrent();
            $table->foreignId('id_capitulo')->constrained('capitulo')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('id_usuario')->constrained('usuario')->cascadeOnUpdate()->restrictOnDelete();

            $table->index('id_capitulo');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('historial_modificacion');
    }
};

