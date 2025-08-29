<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Tooltip from './ui/tooltip';

	interface Props {
		children: Snippet;
		content: string;
	}

	const { children, content }: Props = $props();
</script>

<Tooltip.Root>
	<Tooltip.Trigger>
		{@render children?.()}
	</Tooltip.Trigger>
	<Tooltip.Content>
		<p>{content}</p>
	</Tooltip.Content>
</Tooltip.Root>
