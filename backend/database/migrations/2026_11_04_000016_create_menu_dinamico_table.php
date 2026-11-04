<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_item', function (Blueprint $table) {
            $table->id();
            $table->string('titulo', 100);
            $table->string('ruta', 150);
            $table->string('icono', 50)->nullable();
            $table->integer('orden')->default(0);
            $table->foreignId('id_padre')->nullable()->constrained('menu_item')->cascadeOnUpdate()->cascadeOnDelete();
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        Schema::create('menu_item_rol', function (Blueprint $table) {
            $table->foreignId('id_menu_item')->constrained('menu_item')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('id_rol')->constrained('rol')->cascadeOnUpdate()->cascadeOnDelete();
            $table->primary(['id_menu_item', 'id_rol']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_item_rol');
        Schema::dropIfExists('menu_item');
    }
};

