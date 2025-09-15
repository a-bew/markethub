import { query } from '@/shared/mysql';
import { User } from '@/types/user';
import { v4 as uuidv4 } from 'uuid';

const userModel = {
    createUsersTable: async function() {
        await query(`
            CREATE TABLE IF NOT EXISTS users (
                id CHAR(36) PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL
            )
        `);
    },
    createUser: async function(email: string, hashedPassword: string): Promise<void> {
        const userId = uuidv4();

        await query('INSERT INTO users (id, email, password) VALUES (?, ?, ?)', [userId, email, hashedPassword]);
    },
    findUserByEmail: async function(email: string): Promise<User & { password: string } | null>  {
        const result = await query('SELECT id, email, password FROM users WHERE email = ?', [email]);
        return (result as any[])[0]; // raw DB row
    },
    
    getUserIdByEmail: async function(email: string): Promise<number | undefined> {
        const result = await query('SELECT id FROM users WHERE email = ?', [email]);
        return (result as any[])[0]?.id;
    },
    getUserByEmail: async function(email: string): Promise<User | null> {
        const result = await query('SELECT id, email FROM users WHERE email = ?', [email]);
        return (result as any[])[0];
    },
    emailExists: async function(email: string): Promise<boolean> {
        const result = await query('SELECT id FROM users WHERE email = ?', [email]);
        return (result as any[]).length > 0;
    },

};  

export default userModel;