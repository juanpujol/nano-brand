<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';

	interface Props {
		fitScore: string | null | undefined;
	}

	let { fitScore }: Props = $props();

	// Get fit score styling
	const badgeConfig = $derived(() => {
		if (!fitScore || typeof fitScore !== 'string')
			return { variant: 'secondary' as const, text: '-', class: '' };

		const score = fitScore.toLowerCase();
		switch (score) {
			case 'a':
				return {
					variant: 'outline' as const,
					text: 'A',
					class:
						'border-green-500 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-400 dark:bg-green-950 dark:text-green-400 dark:hover:bg-green-900'
				};
			case 'b':
				return {
					variant: 'outline' as const,
					text: 'B',
					class:
						'border-blue-600 bg-blue-50 text-blue-800 hover:bg-blue-100 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900'
				};
			case 'c':
				return {
					variant: 'outline' as const,
					text: 'C',
					class:
						'border-yellow-500 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-400 dark:bg-yellow-950 dark:text-yellow-400 dark:hover:bg-yellow-900'
				};
			case 'd':
				return {
					variant: 'outline' as const,
					text: 'D',
					class:
						'border-orange-600 bg-orange-50 text-orange-800 hover:bg-orange-100 dark:border-orange-400 dark:bg-orange-950 dark:text-orange-400 dark:hover:bg-orange-900'
				};
			case 'f':
				return {
					variant: 'outline' as const,
					text: 'F',
					class:
						'border-red-500 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-400 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900'
				};
			default:
				return { variant: 'secondary' as const, text: fitScore.toUpperCase(), class: '' };
		}
	});
</script>

<Badge variant={badgeConfig().variant} class={badgeConfig().class}>
	{badgeConfig().text}
</Badge>
