import { Client } from "../Dependencies/dependencias.ts";
import { load } from "../Dependencies/dependencias.ts";

// 📌 Configuración de conexión a la base de datos
let conexion: Client;

try {
  // Cargar variables de entorno
  const env = await load();
  
  // Configuración de conexión
  const config = {
    hostname: env.DB_HOST || "localhost",
    port: parseInt(env.DB_PORT || "3306"),
    username: env.DB_USER || "root",
    password: env.DB_PASSWORD || "",
    db: env.DB_NAME || "agrostock",
    poolSize: parseInt(env.DB_POOL_SIZE || "10"),
    idleTimeout: parseInt(env.DB_IDLE_TIMEOUT || "60000"),
  };

  console.log("🔗 Conectando a la base de datos...");
  console.log(`   Host: ${config.hostname}:${config.port}`);
  console.log(`   Database: ${config.db}`);
  console.log(`   User: ${config.username}`);

  conexion = await new Client().connect(config);
  
  console.log("✅ Conexión a la base de datos establecida correctamente");
  
  // Probar la conexión
  await conexion.query("SELECT 1 as test");
  console.log("✅ Prueba de conexión exitosa");
  
} catch (error) {
  console.error("❌ Error al conectar con la base de datos:", error);
  console.error("   Verifica que:");
  console.error("   - MySQL/MariaDB esté ejecutándose");
  console.error("   - Las credenciales sean correctas");
  console.error("   - La base de datos 'agrostock' exista");
  console.error("   - El usuario tenga permisos suficientes");
  process.exit(1);
}

// 📌 Función para cerrar la conexión (útil para tests)
export const cerrarConexion = async () => {
  try {
    await conexion.close();
    console.log("🔌 Conexión a la base de datos cerrada");
  } catch (error) {
    console.error("Error al cerrar la conexión:", error);
  }
};

// 📌 Función para verificar el estado de la conexión
export const verificarConexion = async (): Promise<boolean> => {
  try {
    await conexion.query("SELECT 1 as test");
    return true;
  } catch (error) {
    console.error("Error al verificar la conexión:", error);
    return false;
  }
};

// 📌 Función para obtener estadísticas de la conexión
export const obtenerEstadisticasConexion = async () => {
  try {
    const stats = await conexion.query("SHOW STATUS LIKE 'Connections'");
    return {
      conexiones_totales: stats[0]?.Value || 0,
      estado: "activa",
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      conexiones_totales: 0,
      estado: "error",
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

export { conexion };