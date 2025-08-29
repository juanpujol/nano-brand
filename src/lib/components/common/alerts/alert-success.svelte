<script lang="ts">
	import type { Snippet } from 'svelte';

	import { CheckCircle } from 'lucide-svelte';

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
	class="relative rounded-xl border border-green-400 bg-green-50 px-4 py-3 text-sm text-green-900 dark:border-green-900 dark:bg-green-950/20 dark:text-green-700"
>
	<div class="absolute -top-2 -left-2 rounded-full bg-green-200 p-1 dark:bg-green-950">
		<CheckCircle size={16} />
	</div>

	<div class="space-y-2">
		{#if children}
			{@render children()}
		{:else}
			<p>{message}</p>
		{/if}
	</div>
</div>
