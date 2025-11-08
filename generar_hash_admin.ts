// Script para generar el hash de contraseña del admin
import { encodeBase64Url } from "./api_movil/Dependencies/dependencias.ts";

async function generarHashAdmin() {
  const password = "admin123";
  
  // Crear un salt aleatorio
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Importar la clave para PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derivar la clave usando PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // 100,000 iteraciones
      hash: 'SHA-256'
    },
    keyMaterial,
    256 // 256 bits
  );

  // Combinar salt y hash
  const combined = new Uint8Array(salt.length + derivedBits.byteLength);
  combined.set(salt);
  combined.set(new Uint8Array(derivedBits), salt.length);

  // Codificar en base64url
  const hash = encodeBase64Url(combined.buffer);
  
  console.log("==========================================");
  console.log("HASH GENERADO PARA ADMIN:");
  console.log("==========================================");
  console.log(`Email: admin@agrostock.com`);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
  console.log("==========================================");
  console.log("\nSQL para actualizar:");
  console.log(`UPDATE usuarios SET password = '${hash}' WHERE email = 'admin@agrostock.com';`);
  console.log("==========================================");
}

generarHashAdmin().catch(console.error);

