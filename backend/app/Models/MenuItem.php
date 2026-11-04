<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MenuItem extends Model
{
    use HasFactory;

    protected $table = 'menu_item';

    protected $fillable = [
        'titulo',
        'ruta',
        'icono',
        'orden',
        'id_padre',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
            'orden' => 'integer',
        ];
    }

    public function padre()
    {
        return $this->belongsTo(MenuItem::class, 'id_padre');
    }

    public function hijos()
    {
        return $this->hasMany(MenuItem::class, 'id_padre')->where('activo', true)->orderBy('orden');
    }

    public function roles()
    {
        return $this->belongsToMany(Rol::class, 'menu_item_rol', 'id_menu_item', 'id_rol');
    }
}

