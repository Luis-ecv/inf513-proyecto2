<?php

use Illuminate\Support\Facades\Route;

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

// Despacho del frontend SPA (React): entrega public/index.html para cualquier ruta que no sea de la API (/api/...)
// En el servidor TecnoWeb (Escenario A), las rutas web de React se resuelven a través de este fallback
Route::get('/{any?}', function () {
    $indexPath = public_path('index.html');
    if (file_exists($indexPath)) {
        return response()->file($indexPath);
    }
    return view('welcome');
})->where('any', '^(?!.*api).*$');

