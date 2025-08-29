<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import { TIME_PERIODS } from '$lib/types/segment-forms';
	import type { FieldDefinition } from '$lib/types/segment-forms';

	interface Props {
		field?: FieldDefinition;
		operator: string;
		value: unknown;
		onValueChange: (
			value: string | string[] | boolean | number | null | { key: string; value: string }
		) => void;
		className?: string;
	}

	let { field, operator, value, onValueChange, className = '' }: Props = $props();

	// Determine if operator requires value input
	const requiresValue = $derived(() => {
		const noValueOperators = ['isEmpty', 'isNotEmpty'];
		return !noValueOperators.includes(operator);
	});

	// Determine value input type based on field and operator
	const inputType = $derived(() => {
		if (!field || !requiresValue()) return 'none';

		// Special handling for specific operators
		if (operator === 'between') return 'range';
		if (operator === 'jsonKeyEquals' || operator === 'jsonContains' || operator === 'jsonKeyExists')
			return 'json';
		if (operator === 'leadHasConversion' || operator === 'leadNotHasConversion')
			return 'conversion';

		// Date field with time-based operators
		if (field.type === 'date' && (operator === 'before' || operator === 'after'))
			return 'time-period';

		// Multi-select for certain operators
		if (operator === 'in' || operator === 'not_in') return 'multi-select';

		// Field options (select type)
		if (field.options && field.options.length > 0) return 'select';

		// Default based on field type
		return field.type;
	});

	// Get current JSON key-value structure
	const jsonValue = $derived(() => {
		if (inputType() === 'json') {
			// Handle object format
			if (typeof value === 'object' && value !== null) {
				return value as { key?: string; value?: string };
			}
			// Handle string format like "key:value" (for backward compatibility)
			if (typeof value === 'string' && value.includes(':')) {
				const [key, ...valueParts] = value.split(':');
				return { key: key.trim(), value: valueParts.join(':').trim() };
			}
		}
		return { key: '', value: '' };
	});

	function handleInputChange(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		let newValue: string | number = target.value;

		if (field?.type === 'number' && newValue) {
			newValue = Number(newValue);
		}

		onValueChange(newValue);
	}

	function handleJsonKeyChange(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		const key = target.value;
		const currentValue = jsonValue();

		onValueChange({
			key,
			value: currentValue.value || ''
		});
	}

	function handleJsonValueChange(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		const newValue = target.value;
		const currentValue = jsonValue();

		onValueChange({
			key: currentValue.key || '',
			value: newValue
		});
	}

	function handleSelectChange(newValue: string | undefined) {
		onValueChange(newValue || null);
	}

	function handleMultiSelectChange(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		const values = target.value
			.split(',')
			.map((v) => v.trim())
			.filter((v) => v.length > 0);
		onValueChange(values);
	}
</script>

<div class={className}>
	{#if !requiresValue()}
		<!-- No value required -->
		<div class="flex h-9 items-center rounded-md bg-muted px-3 py-1 text-sm text-muted-foreground">
			Não requer valor
		</div>
	{:else if inputType() === 'time-period'}
		<!-- Time period selector -->
		<Select.Root
			type="single"
			value={(value as string) || undefined}
			onValueChange={handleSelectChange}
		>
			<Select.Trigger class="h-9">Período...</Select.Trigger>
			<Select.Content>
				{#each TIME_PERIODS as period (period.value)}
					<Select.Item value={period.value}>{period.label}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	{:else if inputType() === 'multi-select'}
		<!-- Multi-select input (comma-separated) -->
		<Input
			placeholder="Valores separados por vírgula..."
			value={Array.isArray(value) ? value.join(', ') : ''}
			oninput={handleMultiSelectChange}
			class="h-9"
		/>
	{:else if inputType() === 'select' && field?.options}
		<!-- Select from predefined options -->
		<Select.Root
			type="single"
			value={(value as string) || undefined}
			onValueChange={handleSelectChange}
		>
			<Select.Trigger class="h-9">Valor...</Select.Trigger>
			<Select.Content>
				{#each field.options as option (option)}
					<Select.Item value={option}>{option}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	{:else if inputType() === 'json'}
		<!-- JSON key-value inputs -->
		{#if operator === 'jsonKeyExists'}
			<!-- Only key input for jsonKeyExists -->
			<Input
				placeholder="Chave JSON..."
				value={typeof value === 'string' ? value : jsonValue().key || ''}
				type="text"
				oninput={operator === 'jsonKeyExists' ? handleInputChange : handleJsonKeyChange}
				class="h-9"
			/>
		{:else if operator === 'jsonKeyEquals' || operator === 'jsonContains'}
			<!-- Both key and value inputs for jsonKeyEquals and jsonContains -->
			<div class="flex flex-col gap-2">
				<Input
					placeholder="Chave JSON..."
					value={jsonValue().key || ''}
					type="text"
					oninput={handleJsonKeyChange}
					class="h-9 flex-1"
				/>
				<Input
					placeholder="Valor JSON..."
					value={jsonValue().value || ''}
					type="text"
					oninput={handleJsonValueChange}
					class="h-9 flex-1"
				/>
			</div>
		{:else}
			<!-- Fallback for other JSON operators -->
			<Input
				placeholder="Valor JSON..."
				value={typeof value === 'string' || typeof value === 'number' ? String(value) : ''}
				type="text"
				oninput={handleInputChange}
				class="h-9"
			/>
		{/if}
	{:else if inputType() === 'conversion'}
		<!-- Conversion name input -->
		<Input
			placeholder="Nome da conversão..."
			value={typeof value === 'string' ? value : ''}
			type="text"
			oninput={handleInputChange}
			class="h-9"
		/>
	{:else if inputType() === 'range'}
		<!-- Range input (for between operator) -->
		<Input
			placeholder="min,max ou data1,data2..."
			value={typeof value === 'string' ? value : ''}
			type="text"
			oninput={handleInputChange}
			class="h-9"
		/>
	{:else}
		<!-- Default input based on field type -->
		<Input
			placeholder="Valor..."
			value={typeof value === 'string' || typeof value === 'number' ? String(value) : ''}
			type={field?.type === 'number' ? 'number' : field?.type === 'date' ? 'date' : 'text'}
			oninput={handleInputChange}
			class="h-9"
		/>
	{/if}
</div>
