export function isValidName(value: unknown): boolean {
	if (typeof value !== 'string') return false;

	const name = value.trim();

	return /^[\p{L}\p{N}]+(?: +[\p{L}\p{N}]+)*$/u.test(name);
}
