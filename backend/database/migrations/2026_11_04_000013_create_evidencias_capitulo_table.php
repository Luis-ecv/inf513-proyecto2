<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evidencia_capitulo', function (Blueprint $table) {
            $table->foreignId('id_capitulo')->constrained('capitulo')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('id_documento_evidencia')->constrained('documento_evidencia')->cascadeOnUpdate()->restrictOnDelete();
            $table->timestamp('fecha_vinculacion')->useCurrent();
            $table->primary(['id_capitulo', 'id_documento_evidencia']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evidencia_capitulo');
    }
};

