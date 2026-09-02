import bcrypt from 'bcryptjs';

const COST = 10;

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, COST);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}
