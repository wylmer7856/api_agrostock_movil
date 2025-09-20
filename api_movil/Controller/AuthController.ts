import {
  Context,
  create,
  getNumericDate,
} from "../Dependencies/dependencias.ts";
import type { Header, Payload } from "../Dependencies/dependencias.ts";
import { Usuario } from "../Models/UsuariosModel.ts";

const secret = "mi_clave_secreta"; 
const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(secret),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"],
);
export class AuthController {
  static async login(ctx: Context) {
    try {
      
      const body = await ctx.request.body.json();
      const { email, password } = body;

      if (!email || !password) {
        ctx.response.status = 404;
        ctx.response.body = { error: "Email y contraseña son requeridos" };
        return;
      }

      const userInstance = new Usuario();
      const usuario = await userInstance.buscarPorEmail(email);

      if (!usuario || usuario.password !== password) {
        ctx.response.status = 401;
        ctx.response.body = { error: "Credenciales invalidas" };
        return;
      }

      const payload: Payload = {
        id: usuario.id_usuario!,
        rol: usuario.rol,
        exp: getNumericDate(60 * 60), // expira en 1 hora
      };

      const header: Header = { alg: "HS256", typ: "JWT" };
      const jwt = await create(header, payload, key);

      ctx.response.status = 200;
      ctx.response.body = {
        message: "Login exitoso",
        token: jwt,
        usuario: {
          id: usuario.id_usuario,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
        },
      };
    } catch (error) {
      console.error("Error en login:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }
}
