# ¿Quién hizo qué?

Frontend Angular para organizar tareas y gastos de pisos compartidos.

## Desarrollo local

1. Inicia la API Spring Boot en `http://localhost:8080/api`.
2. Asegúrate de que la API permite CORS desde `http://localhost:4200` y que Spring Security deja pasar las peticiones `OPTIONS` de preflight sin autenticación.
3. Ejecuta `npm start` y abre `http://localhost:4200`.

La URL base de la API se configura con `API_BASE_URL` en `.env`; por defecto es
`http://localhost:8080/api`. El inicio de sesión usa `POST /auth/login` y el registro
usa `POST /usuarios`.

HTTP sin TLS solo está permitido para `localhost` en desarrollo. En otros entornos,
configura `API_BASE_URL` con una URL `https://`. La API debe terminar TLS, guardar
contraseñas con un hash robusto (por ejemplo Argon2id o bcrypt) y limitar CORS a los
orígenes necesarios; el frontend no puede sustituir esas protecciones.

En el inicio de sesión, “Mantener sesión iniciada” guarda el token en el almacenamiento
persistente del navegador; sin marcarlo, se conserva solo en la sesión actual. El
almacenamiento del navegador es accesible desde JavaScript; para mayor protección,
la API debería gestionar la sesión con una cookie `HttpOnly`, `Secure` y `SameSite`.

## Validación

- `npm test` ejecuta las pruebas unitarias.
- `npm run build` compila la aplicación.
