import bcrypt from 'bcrypt';
import { generateToken } from '@/utils/jwt';
import userModel from '@/models/user.model';
import { AuthInput } from '@/validations/authSchema';
import { User } from '@/types/user';

function serializeUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    userId: row.id,
    username: row.email.split('@')[0],
  };
}

const userService = {
  registerUser: async function(input: AuthInput): Promise<{ user: User; token: string }> {
    const { email, password } = input;

    const existingUser = await userModel.findUserByEmail(email);
    if (existingUser) throw new Error('Email already registered');

    const hashed = await bcrypt.hash(password, 10);
    await userModel.createUser(email, hashed);

    // const id = await userModel.getUserIdByEmail(email);
    // const user: User = { id: id!, email };
    // return generateToken(user);
    const user = await userModel.getUserByEmail(email);
    if (!user) throw new Error('Failed to retrieve user');

    const token = generateToken(user);
    return { user, token };
  },
  loginUser: async function(input: AuthInput): Promise<{ user: User; token: string }> {
      const { email, password } = input;

      const userRow = await userModel.findUserByEmail(email);
      if (!userRow) throw new Error('Invalid email or password');

      const match = await bcrypt.compare(password, userRow.password);
      if (!match) throw new Error('Invalid email or password');

      const user = serializeUser(userRow);
      const token = generateToken(user);
      return { user, token };
  }

};

export default userService;