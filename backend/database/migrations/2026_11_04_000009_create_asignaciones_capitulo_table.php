<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asignacion_capitulo', function (Blueprint $table) {
            $table->foreignId('id_capitulo')->constrained('capitulo')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('id_usuario')->constrained('usuario')->cascadeOnUpdate()->cascadeOnDelete();
            $table->timestamp('fecha_asignacion')->useCurrent();
            $table->primary(['id_capitulo', 'id_usuario']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asignacion_capitulo');
    }
};

