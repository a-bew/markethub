import { logger } from '@/utils/logger';
import mysql from 'mysql2/promise';

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  
  waitForConnections: true,
  connectionLimit: 10, // Adjust based on your needs
  queueLimit: 0,
  
});

// Export the pool for reuse
export const getConnection = async () => {
  return await pool.getConnection();
};

// Export the pool directly for simple queries
export const query = async (sql: string, values?: any) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(sql, values);
    return rows;
  } finally {
    connection.release(); // Always release the connection
  }
};

// Export the pool for transactions
export const executeTransaction = async (callback: (connection: mysql.PoolConnection) => Promise<void>) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await callback(connection); // Execute the transaction logic
    await connection.commit();
  } catch (error:any) {
    logger.info(error.message)    
    await connection.rollback();
    throw error; // Re-throw the error for handling in the calling function
  } finally {
    connection.release(); // Always release the connection
  }
};