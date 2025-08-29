/**
 * Flattens a nested webhook payload object into a flat structure with dot notation keys.
 * This makes webhook data easier to map to target fields by creating accessible key paths.
 *
 * @param obj - The webhook payload object to flatten
 * @param prefix - Internal prefix for nested keys (used recursively)
 * @returns A flat object with dot-notation keys (e.g., "user.profile.name")
 *
 * @example
 * ```typescript
 * const payload = {
 *   user: { name: "John", profile: { age: 30 } },
 *   items: ["a", "b"]
 * };
 *
 * const flattened = flattenWebhookPayload(payload);
 * // Result: {
 * //   "user.name": "John",
 * //   "user.profile.age": 30,
 * //   "items": ["a", "b"],
 * //   "items[0]": "a",
 * //   "items[1]": "b"
 * // }
 * ```
 */
export function flattenWebhookPayload(obj: unknown, prefix = ''): Record<string, unknown> {
	const result: Record<string, unknown> = {};

	if (Array.isArray(obj)) {
		// Add the array itself as a mappable field
		if (prefix) {
			result[prefix] = obj;
		}

		// Then add individual array items
		obj.forEach((item, index) => {
			const newKey = prefix ? `${prefix}[${index}]` : `[${index}]`;
			if (item !== null && typeof item === 'object') {
				Object.assign(result, flattenWebhookPayload(item, newKey));
			} else {
				result[newKey] = item;
			}
		});
	} else if (obj !== null && typeof obj === 'object') {
		for (const key in obj) {
			if (Object.prototype.hasOwnProperty.call(obj, key)) {
				const newKey = prefix ? `${prefix}.${key}` : key;
				const value = (obj as Record<string, unknown>)[key];

				if (value !== null && typeof value === 'object') {
					// If it's an array, add it as a mappable field before flattening
					if (Array.isArray(value)) {
						result[newKey] = value;
					}
					Object.assign(result, flattenWebhookPayload(value, newKey));
				} else {
					result[newKey] = value;
				}
			}
		}
	} else {
		result[prefix || 'value'] = obj;
	}

	return result;
}
