export const escapeLikePattern = (value: string): string => {
	return value.replace(/[\\%_]/g, character => `\\${character}`);
};