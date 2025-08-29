import { customAlphabet } from 'nanoid';

export function nanoid(size = 12) {
	const nid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', size);

	return nid();
}
