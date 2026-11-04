<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rol extends Model
{
    use HasFactory;

    protected $table = 'rol';

    protected $fillable = [
        'nombre',
        'descripcion',
    ];

    public function usuarios()
    {
        return $this->hasMany(User::class, 'id_rol');
    }

    public function menuItems()
    {
        return $this->belongsToMany(MenuItem::class, 'menu_item_rol', 'id_rol', 'id_menu_item');
    }
}

