<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prerrequisito', function (Blueprint $table) {
            $table->foreignId('id_asignatura')->constrained('asignatura')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('id_asignatura_requisito')->constrained('asignatura')->cascadeOnUpdate()->cascadeOnDelete();
            $table->primary(['id_asignatura', 'id_asignatura_requisito']);
        });

        // Asegurar que una asignatura no sea prerrequisito de sí misma
        DB::statement('ALTER TABLE prerrequisito ADD CONSTRAINT chk_no_autorequisito CHECK (id_asignatura <> id_asignatura_requisito)');
    }

    public function down(): void
    {
        Schema::dropIfExists('prerrequisito');
    }
};

