<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';

	interface Props {
		isRequired: boolean;
	}

	let { isRequired }: Props = $props();

	const badgeConfig = $derived(() => {
		if (isRequired) {
			return {
				variant: 'outline' as const,
				text: 'Sim',
				class:
					'border-red-500 bg-red-50 text-red-700 dark:border-red-400 dark:bg-red-950 dark:text-red-400'
			};
		} else {
			return {
				variant: 'outline' as const,
				text: 'Não',
				class:
					'border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300'
			};
		}
	});
</script>

<Badge variant={badgeConfig().variant} class={badgeConfig().class}>
	{badgeConfig().text}
</Badge>
