<script lang="ts">
	import { cn } from '$lib/utils/ui';

	interface Props {
		value: string;
		class?: string;
	}

	let { value, class: className }: Props = $props();
</script>

<code class={cn('rounded bg-muted px-2 py-1 font-mono text-xs', className)}>
	{value}
</code>
