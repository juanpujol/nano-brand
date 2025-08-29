<script lang="ts">
	import type { Snippet } from 'svelte';

	import { ShieldX } from 'lucide-svelte';

	interface ErrorsProps {
		errors: string[];
		children?: never;
	}

	interface ChildrenProps {
		errors?: never;
		children: Snippet;
	}

	// Combine them with a union type
	type Props = ErrorsProps | ChildrenProps;

	const { errors, children }: Props = $props();
</script>

<div
	class="relative rounded-xl border border-red-400 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/20 dark:text-red-400"
>
	<div class="absolute -top-2 -left-2 rounded-full bg-red-300 p-1 dark:bg-red-950">
		<ShieldX size={16} />
	</div>

	<div class="space-y-2">
		{#if children}
			{@render children()}
		{:else}
			{#if errors.length > 1}
				<p class="font-semibold">Errors:</p>
			{/if}
			{#if errors.length === 1}
				{errors[0]}
			{:else}
				<ul class="ml-4 list-disc space-y-1">
					{#each errors as error (error)}
						<li>{error}</li>
					{/each}
				</ul>
			{/if}
		{/if}
	</div>
</div>
