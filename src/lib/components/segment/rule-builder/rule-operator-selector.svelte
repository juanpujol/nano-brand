<script lang="ts">
	import * as Select from '$lib/components/ui/select';
	import { OPERATOR_LABELS } from '$lib/types/segments';

	interface Props {
		operators: string[];
		selectedOperator: string;
		onOperatorChange: (operator: string) => void;
		className?: string;
	}

	let { operators, selectedOperator, onOperatorChange, className = '' }: Props = $props();

	const triggerContent = $derived(() => {
		return OPERATOR_LABELS[selectedOperator] || selectedOperator || 'Operador...';
	});

	function handleOperatorChange(operator: string | undefined) {
		if (!operator) return;
		onOperatorChange(operator);
	}
</script>

<div class={className}>
	<Select.Root type="single" value={selectedOperator} onValueChange={handleOperatorChange}>
		<Select.Trigger class="h-9 w-full">
			{triggerContent()}
		</Select.Trigger>
		<Select.Content>
			{#each operators as operator (operator)}
				<Select.Item value={operator}>
					{OPERATOR_LABELS[operator] || operator}
				</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>
</div>
