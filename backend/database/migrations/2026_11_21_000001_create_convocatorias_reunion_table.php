<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('convocatoria_reunion', function (Blueprint $table) {
            $table->id();
            $table->string('codigo_convocatoria', 50)->unique();
            $table->string('titulo', 255);
            $table->date('fecha_reunion');
            $table->string('hora_reunion', 20);
            $table->string('lugar', 255);
            $table->string('modalidad', 50)->default('presencial'); // presencial, virtual, hibrida
            $table->string('enlace_virtual', 500)->nullable();
            $table->json('orden_del_dia'); // Array de puntos/temas a tratar
            $table->json('enlaces_documentos')->nullable(); // Enlaces a capítulos/evidencias
            $table->string('ruta_pdf', 500)->nullable();
            $table->foreignId('id_usuario_convocador')->constrained('usuario')->onDelete('cascade');
            $table->unsignedInteger('total_convocados')->default(0);
            $table->unsignedInteger('total_excluidos')->default(0);
            $table->timestamps();
        });

        Schema::create('convocatoria_destinatario', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_convocatoria')->constrained('convocatoria_reunion')->onDelete('cascade');
            $table->foreignId('id_usuario')->constrained('usuario')->onDelete('cascade');
            $table->string('email_destinatario', 150);
            $table->string('estado_envio', 50)->default('enviado'); // enviado, fallido, contingencia
            $table->timestamp('fecha_envio')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('convocatoria_destinatario');
        Schema::dropIfExists('convocatoria_reunion');
    }
};
