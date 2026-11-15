<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Ruta de respaldo para servir archivos de almacenamiento público en entornos sin enlaces simbólicos
Route::get('/storage/{path}', function (string $path) {
    $filePath = storage_path('app/public/' . $path);
    if (!file_exists($filePath)) {
        abort(404);
    }
    $mime = mime_content_type($filePath) ?: 'application/octet-stream';
    return response(file_get_contents($filePath), 200, [
        'Content-Type' => $mime,
        'Content-Length' => filesize($filePath),
        'Cache-Control' => 'public, max-age=86400',
    ]);
})->where('path', '.*');

