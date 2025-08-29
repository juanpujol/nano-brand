<script lang="ts">
	import type { Snippet } from 'svelte';

	import { TriangleAlert } from 'lucide-svelte';

	interface MessageProps {
		message: string;
		children?: never;
	}

	interface ChildrenProps {
		message?: never;
		children: Snippet;
	}

	// Combine them with a union type
	type Props = MessageProps | ChildrenProps;

	const { message, children }: Props = $props();
</script>

<div
	class="relative rounded-xl border border-orange-400 bg-orange-50 px-4 py-3 text-sm text-orange-900 dark:border-yellow-900 dark:bg-yellow-950/20 dark:text-yellow-600"
>
	<div class="absolute -top-2 -left-2 rounded-full bg-orange-300 p-1 dark:bg-yellow-950">
		<TriangleAlert size={16} />
	</div>

	<div class="space-y-2">
		{#if children}
			{@render children()}
		{:else}
			<p>{message}</p>
		{/if}
	</div>
</div>
