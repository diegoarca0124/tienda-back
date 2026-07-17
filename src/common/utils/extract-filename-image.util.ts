export const extractFileNameImage = (url: string) => {
	return url.split('/').pop() || '';
};
