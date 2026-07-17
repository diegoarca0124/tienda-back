import * as bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(password, salt);
	return hashedPassword;
}

export async function comparePasswords(enteredPassword: string, storedPassword: string): Promise<boolean> {
	return bcrypt.compare(enteredPassword, storedPassword);
}
