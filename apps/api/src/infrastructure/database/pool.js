import mysql from 'mysql2/promise';

export function createPool(config) {
  return mysql.createPool({ ...config, connectionLimit: 5, connectTimeout: 5000,
    charset: 'utf8mb4_unicode_ci', timezone: 'Z', multipleStatements: false });
}
export async function transaction(pool, callback) {
  const connection = await pool.getConnection();
  try {
    await connection.query("SET time_zone = '+00:00'");
    await connection.query("SET SESSION sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");
    await connection.beginTransaction();
    const value = await callback(connection);
    await connection.commit();
    return value;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}
