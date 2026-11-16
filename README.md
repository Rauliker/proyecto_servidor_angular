# ¿Quién hizo qué?

Frontend Angular para organizar tareas y gastos de pisos compartidos.

## Desarrollo local

1. Inicia la API Spring Boot en `http://localhost:8080`.
2. Asegúrate de que la API permite CORS desde `http://localhost:4200` y que Spring Security deja pasar las peticiones `OPTIONS` de preflight sin autenticación.
3. Ejecuta `npm start` y abre `http://localhost:4200`.

La URL base de la API se configura con `API_BASE_URL` en `.env`; por defecto es
`http://localhost:8080`. El inicio de sesión usa `POST /auth/login` y el registro
usa `POST /usuarios`.

## Validación

- `npm test` ejecuta las pruebas unitarias.
- `npm run build` compila la aplicación.
