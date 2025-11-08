import { Client } from "../Dependencies/dependencias.ts";
import { load } from "../Dependencies/dependencias.ts";

// 📌 Configuración de conexión a la base de datos
let conexion: Client;
let isConnected = false;

// Función para inicializar la conexión
async function inicializarConexion() {
  if (isConnected && conexion) {
    return conexion;
  }

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
    
    isConnected = true;
    return conexion;
    
  } catch (error) {
    console.error("❌ Error al conectar con la base de datos:", error);
    console.error("   Verifica que:");
    console.error("   - MySQL/MariaDB esté ejecutándose");
    console.error("   - Las credenciales sean correctas");
    console.error("   - La base de datos 'agrostock' exista");
    console.error("   - El usuario tenga permisos suficientes");
    isConnected = false;
    throw error;
  }
}

// Inicializar conexión al cargar el módulo
await inicializarConexion();

// 📌 Función para obtener la conexión (con reconexión automática)
export const obtenerConexion = async (): Promise<Client> => {
  try {
    if (!isConnected || !conexion) {
      return await inicializarConexion();
    }
    // Verificar que la conexión sigue activa
    await conexion.query("SELECT 1 as test");
    return conexion;
  } catch (error) {
    console.warn("⚠️ Conexión perdida, intentando reconectar...");
    isConnected = false;
    return await inicializarConexion();
  }
};

// 📌 Función para cerrar la conexión (útil para tests)
export const cerrarConexion = async () => {
  try {
    if (conexion) {
      await conexion.close();
      isConnected = false;
      console.log("🔌 Conexión a la base de datos cerrada");
    }
  } catch (error) {
    console.error("Error al cerrar la conexión:", error);
  }
};

// 📌 Función para verificar el estado de la conexión
export const verificarConexion = async (): Promise<boolean> => {
  try {
    const conn = await obtenerConexion();
    await conn.query("SELECT 1 as test");
    return true;
  } catch (error) {
    console.error("Error al verificar la conexión:", error);
    return false;
  }
};

// 📌 Función para obtener estadísticas de la conexión
export const obtenerEstadisticasConexion = async () => {
  try {
    const conn = await obtenerConexion();
    const stats = await conn.query("SHOW STATUS LIKE 'Connections'");
    return {
      conexiones_totales: stats[0]?.Value || 0,
      estado: "activa",
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      conexiones_totales: 0,
      estado: "error",
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };
  }
};

// Exportar conexión directa (para compatibilidad con código existente)
// Nota: Se recomienda usar obtenerConexion() para mejor manejo de errores
export { conexion };