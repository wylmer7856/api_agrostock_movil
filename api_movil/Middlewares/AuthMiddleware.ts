import { Context } from "../Dependencies/dependencias.ts";
import { verify } from "../Dependencies/dependencias.ts";
import { load } from "../Dependencies/dependencias.ts";

// Cargar variables de entorno
const env = await load();
const secret = env.JWT_SECRET || "fallback_secret";

// Importamos la clave para verificar el JWT
const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(secret),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"],
);

// Middleware de autenticación
export async function AuthMiddleware(ctx: Context, next: () => Promise<unknown>) {
  const headers = ctx.request.headers;
  const authorization = headers.get("Authorization");

  if (!authorization) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Token no proporcionado" };
    return;
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Formato de autorización inválido" };
    return;
  }

  try {
    // Verificar el token
    const payload = await verify(token, key);
    // Guardamos el payload en el contexto para usarlo en los controladores
    ctx.state.user = payload;
    await next();
  } catch (_e) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Token inválido o expirado" };
  }
}
