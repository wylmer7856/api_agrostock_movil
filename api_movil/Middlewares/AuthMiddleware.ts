// deno-lint-ignore-file
import { Context } from "../Dependencies/dependencias.ts";
import { verify } from "../Dependencies/dependencias.ts";
import { load } from "../Dependencies/dependencias.ts";

const env = await load();
const secret = env.JWT_SECRET || "fallback_secret";

const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(secret),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"],
);

// Middleware de autenticación con validación de roles
export function AuthMiddleware(rolesPermitidos: string[] = []) {
  return async (ctx: Context, next: () => Promise<unknown>) => {
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
      const payload: any = await verify(token, key);

      // Guardamos el payload en el contexto
      ctx.state.user = payload;

      // 🚨 Validar roles si el endpoint requiere alguno
      if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(payload.rol)) {
        ctx.response.status = 403;
        ctx.response.body = { error: "No tienes permisos para acceder a este recurso" };
        return;
      }

      await next();
    } catch (_e) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Token inválido o expirado" };
    }
  };
}
