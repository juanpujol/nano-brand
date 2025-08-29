<script lang="ts">
	interface Props {
		value: string;
		class?: string;
	}

	let { value, class: className }: Props = $props();
</script>

<div class={className}>{value}</div>
