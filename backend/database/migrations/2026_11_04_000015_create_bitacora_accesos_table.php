<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bitacora_acceso', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_usuario')->nullable()->constrained('usuario')->cascadeOnUpdate()->nullOnDelete();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('tipo_evento', 50); // 'login_exitoso', 'login_fallido', 'recurso_accedido'
            $table->string('recurso_accedido', 255); // ruta de endpoint accedido
            $table->string('metodo_http', 10)->nullable(); // GET, POST, PUT, DELETE
            $table->text('detalle')->nullable(); // info adicional (email intentado, motivo de fallo, etc.)
            $table->timestamp('fecha_hora')->useCurrent();

            $table->index('tipo_evento');
            $table->index('fecha_hora');
            $table->index(['recurso_accedido', 'metodo_http']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bitacora_acceso');
    }
};

