<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { TrashIcon } from '@lucide/svelte';
	import RuleFieldSelector from './rule-field-selector.svelte';
	import RuleOperatorSelector from './rule-operator-selector.svelte';
	import RuleValueInput from './rule-value-input.svelte';
	import type { SegmentRule, FieldType, RuleOperator } from '$lib/types/segments';
	import type { FieldDefinition } from '$lib/types/segment-forms';

	interface Props {
		rule: SegmentRule;
		fields: FieldDefinition[];
		onRuleChange: (updatedRule: SegmentRule) => void;
		onRemoveRule: () => void;
	}

	let { rule, fields, onRuleChange, onRemoveRule }: Props = $props();

	// Find the selected field definition
	const selectedField = $derived(() => {
		return fields.find((f) => f.id === rule.field);
	});

	// Check if rule is invalid
	const isInvalidRule = $derived(() => {
		return !selectedField();
	});

	// Get available operators for selected field
	const availableOperators = $derived(() => {
		const field = selectedField();
		if (!field) return [];
		return field.operators || [];
	});

	function handleFieldChange(fieldId: string) {
		const newField = fields.find((f) => f.id === fieldId);
		if (!newField) return;

		// Ensure we have a valid operator for the new field
		let operatorToUse = rule.operator;
		if (!newField.operators.includes(operatorToUse)) {
			operatorToUse = (newField.operators[0] || 'equals') as RuleOperator;
		}

		const newRule: SegmentRule = {
			...rule,
			field: fieldId,
			operator: operatorToUse,
			fieldGroup: newField.fieldGroup,
			// Reset value when changing fields
			value: null
		};

		onRuleChange(newRule);
	}

	function handleGroupChange(group: FieldType) {
		// Find first field in new group
		const firstFieldInGroup = fields.find((f) => f.fieldGroup === group);
		if (firstFieldInGroup) {
			handleFieldChange(firstFieldInGroup.id);
		}
	}

	function handleOperatorChange(operator: string) {
		if (!operator) return;

		onRuleChange({
			...rule,
			operator: operator as RuleOperator,
			// Reset value when changing operators that might be incompatible
			value: null
		});
	}

	function handleValueChange(
		value: string | string[] | boolean | number | null | { key: string; value: string }
	) {
		onRuleChange({
			...rule,
			value
		});
	}
</script>

<div
	class="flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center {isInvalidRule()
		? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30'
		: 'border-border bg-card dark:bg-card/50'}"
>
	<div class="w-full md:w-3/4">
		<RuleFieldSelector
			fieldOptions={fields}
			selectedField={rule.field}
			selectedGroup={rule.fieldGroup}
			onFieldChange={handleFieldChange}
			onGroupChange={handleGroupChange}
			className="w-full"
		/>
	</div>

	<div class="w-full md:w-1/3">
		{#if selectedField()}
			<RuleOperatorSelector
				operators={availableOperators()}
				selectedOperator={rule.operator}
				onOperatorChange={handleOperatorChange}
				className="w-full"
			/>
		{/if}
	</div>

	<div class="w-full md:w-1/4">
		<RuleValueInput
			field={selectedField()}
			operator={rule.operator}
			value={rule.value}
			onValueChange={handleValueChange}
			className="w-full"
		/>
	</div>

	<div class="w-10">
		<Button
			variant="ghost"
			size="icon"
			onclick={onRemoveRule}
			class="text-destructive hover:bg-destructive/10 hover:text-destructive/80"
		>
			<TrashIcon class="h-4 w-4" />
			<span class="sr-only">Remover regra</span>
		</Button>
	</div>
</div>
