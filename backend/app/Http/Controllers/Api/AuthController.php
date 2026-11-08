<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\StoreUserRequest;
use App\Models\MenuItem;
use App\Models\Rol;
use App\Models\User;
use App\Services\AuditBitacoraService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class AuthController extends Controller
{
    public function __construct(
        protected AuditBitacoraService $auditService
    ) {}

    /**
     * Autenticación de usuario con email o username y generación de token Sanctum (CU1, Req. 4).
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $loginInput = $request->input('login');
        $password = $request->input('password');

        $user = User::with('rol')
            ->where('email', $loginInput)
            ->orWhere('username', $loginInput)
            ->first();

        $storedHash = $user?->password;
        $passwordValid = false;

        if ($storedHash) {
            if (Hash::check($password, $storedHash) || hash('sha256', $password) === $storedHash) {
                $passwordValid = true;
            }
        }

        if (!$user || !$passwordValid) {
            $this->auditService->registrarLoginFallido($loginInput, $request, 'Credenciales incorrectas');
            return response()->json([
                'success' => false,
                'message' => 'Credenciales inválidas. Verifique su correo/usuario y contraseña.',
            ], 401);
        }

        if (!$user->activo) {
            $this->auditService->registrarLoginFallido($loginInput, $request, 'Cuenta inactiva');
            return response()->json([
                'success' => false,
                'message' => 'Su cuenta se encuentra inactiva. Contacte a la Dirección de Carrera.',
            ], 403);
        }

        // Registrar login exitoso en bitácora
        $this->auditService->registrarLoginExitoso($user, $request);

        // Crear token de acceso Sanctum
        $token = $user->createToken('spa-auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => "Bienvenido(a), {$user->nombre_completo}.",
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'nombreCompleto' => $user->nombre_completo,
                'email' => $user->email,
                'username' => $user->username,
                'fotoRuta' => $user->foto_ruta,
                'rol' => $user->rol?->nombre,
                'idRol' => $user->id_rol,
            ],
        ]);
    }

    /**
     * Cierre de sesión y revocación del token activo.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            $user->currentAccessToken()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Sesión cerrada exitosamente.',
        ]);
    }

    /**
     * Retorna el perfil del usuario autenticado.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('rol');

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'nombreCompleto' => $user->nombre_completo,
                'email' => $user->email,
                'username' => $user->username,
                'fotoRuta' => $user->foto_ruta,
                'rol' => $user->rol?->nombre,
                'idRol' => $user->id_rol,
            ],
        ]);
    }

    /**
     * Menú Dinámico según el Rol del usuario autenticado desde BD (Requisito 2).
     */
    public function menu(Request $request): JsonResponse
    {
        $user = $request->user();
        $idRol = $user->id_rol;

        $items = MenuItem::whereHas('roles', function ($q) use ($idRol) {
            $q->where('rol.id', $idRol);
        })
        ->where('activo', true)
        ->whereNull('id_padre')
        ->with(['hijos' => function ($q) use ($idRol) {
            $q->whereHas('roles', function ($r) use ($idRol) {
                $r->where('rol.id', $idRol);
            })->orderBy('orden');
        }])
        ->orderBy('orden')
        ->get();

        return response()->json([
            'success' => true,
            'menu' => $items,
        ]);
    }

    /**
     * Catálogo de roles disponibles.
     */
    public function roles(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'roles' => Rol::all(),
        ]);
    }

    /**
     * Listado de usuarios con foto y rol (CU1).
     */
    public function listarUsuarios(): JsonResponse
    {
        $usuarios = User::with('rol')->orderBy('id_rol')->orderBy('nombre_completo')->get();

        return response()->json([
            'success' => true,
            'usuarios' => $usuarios,
        ]);
    }

    /**
     * Registro de nuevo usuario (CU1).
     */
    public function storeUsuario(StoreUserRequest $request): JsonResponse
    {
        $data = $request->validated();
        $fotoRuta = 'fotos/default.png';

        if ($request->hasFile('foto')) {
            $fotoRuta = $request->file('foto')->store('fotos', 'public');
        }

        $user = User::create([
            'nombre_completo' => $data['nombre_completo'],
            'email' => $data['email'],
            'username' => $data['username'],
            'password' => $data['password'],
            'foto_ruta' => $fotoRuta,
            'activo' => true,
            'id_rol' => $data['id_rol'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Usuario registrado exitosamente.',
            'usuario' => $user->load('rol'),
        ], 201);
    }

    /**
     * Actualizar perfil del usuario autenticado (CU1: cada usuario solo edita su propio perfil).
     */
    public function actualizarPerfil(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'nombre_completo' => 'nullable|string|max:120',
            'password' => 'nullable|string|min:8|max:25|regex:/^[a-zA-Z0-9ñÑ]+$/',
            'foto' => 'nullable|image|max:2048',
        ], [
            'nombre_completo.max' => 'El nombre no puede exceder los 120 caracteres.',
            'password.min' => 'La contraseña debe contener al menos 8 caracteres.',
            'password.max' => 'La contraseña no puede exceder los 25 caracteres.',
            'password.regex' => 'La contraseña solo permite caracteres alfanuméricos y la letra ñ/Ñ (sin símbolos).',
            'foto.image' => 'El archivo seleccionado debe ser una imagen válida.',
            'foto.max' => 'La imagen no debe superar los 2 MB.',
        ]);

        if ($request->filled('nombre_completo')) {
            $user->nombre_completo = trim($request->input('nombre_completo'));
        }

        if ($request->filled('password')) {
            $user->password = Hash::make($request->input('password'));
        }

        if ($request->hasFile('foto')) {
            $fotoRuta = $request->file('foto')->store('fotos', 'public');
            $user->foto_ruta = $fotoRuta;
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Perfil actualizado exitosamente.',
            'user' => [
                'id' => $user->id,
                'nombreCompleto' => $user->nombre_completo,
                'email' => $user->email,
                'username' => $user->username,
                'fotoRuta' => $user->foto_ruta,
                'rol' => $user->rol?->nombre,
                'idRol' => $user->id_rol,
            ],
        ]);
    }
}

