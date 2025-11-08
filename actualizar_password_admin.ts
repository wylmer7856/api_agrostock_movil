// Script para actualizar la contraseña del admin en la base de datos
import { conexion, cerrarConexion } from "./api_movil/Models/Conexion.ts";
import { securityService } from "./api_movil/Services/SecurityService.ts";

async function actualizarPasswordAdmin() {
  try {
    console.log("🔐 Conectando a la base de datos...");
    
    const email = "admin@agrostock.com";
    const nuevaPassword = "admin123";
    
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Nueva contraseña: ${nuevaPassword}`);
    console.log("⏳ Generando hash de contraseña...");
    
    // Generar hash de la contraseña
    const hashedPassword = await securityService.hashPassword(nuevaPassword);
    
    console.log(`✅ Hash generado: ${hashedPassword.substring(0, 50)}...`);
    console.log("💾 Actualizando contraseña en la base de datos...");
    
    // Actualizar la contraseña en la base de datos
    const result = await conexion.execute(
      `UPDATE usuarios SET password = ? WHERE email = ?`,
      [hashedPassword, email]
    );
    
    console.log("✅ Contraseña actualizada exitosamente!");
    console.log("\n==========================================");
    console.log("CREDENCIALES DEL ADMIN:");
    console.log("==========================================");
    console.log(`Email: ${email}`);
    console.log(`Password: ${nuevaPassword}`);
    console.log("==========================================");
    
    // Cerrar conexión
    await cerrarConexion();
    
  } catch (error) {
    console.error("❌ Error:", error);
    Deno.exit(1);
  }
}

actualizarPasswordAdmin();

