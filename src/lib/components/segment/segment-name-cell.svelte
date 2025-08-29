<script lang="ts">
	interface Props {
		name: string | null;
		description: string | null;
	}

	let { name, description }: Props = $props();
</script>

<div class="space-y-1">
	<div class="text-sm font-medium">{name || '-'}</div>
	<div class="line-clamp-2 hidden text-xs text-muted-foreground sm:flex">
		{description || 'Sem descrição'}
	</div>
</div>
