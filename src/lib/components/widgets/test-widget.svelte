<script lang="ts">
	import type { TestWidgetProps } from '$lib/types/dashboard';

	type Props = TestWidgetProps;

	let { title = 'Test Widget', description, color = 'bg-blue-500' }: Props = $props();
</script>

<div class="h-full w-full {color} flex items-center justify-center rounded-lg">
	<div class="text-center text-xl font-bold text-white">
		<div>{title}</div>
		{#if description}
			<div class="mt-1 text-sm opacity-80">{description}</div>
		{/if}
	</div>
</div>
