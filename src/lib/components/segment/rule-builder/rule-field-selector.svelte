<script lang="ts">
	import * as Select from '$lib/components/ui/select';
	import { FIELD_GROUPS } from '$lib/types/segments';
	import type { FieldType } from '$lib/types/segments';
	import type { FieldDefinition } from '$lib/types/segment-forms';

	interface Props {
		fieldOptions: FieldDefinition[];
		selectedField: string;
		selectedGroup?: FieldType;
		onFieldChange: (field: string) => void;
		onGroupChange?: (group: FieldType) => void;
		className?: string;
	}

	let {
		fieldOptions,
		selectedField,
		selectedGroup,
		onFieldChange,
		onGroupChange,
		className = ''
	}: Props = $props();

	// Determine current group from selected field if not provided
	const currentGroup = $derived(() => {
		if (selectedGroup) return selectedGroup;
		const field = fieldOptions.find((f) => f.id === selectedField);
		return field?.fieldGroup || 'lead';
	});

	// Filter options based on selected group
	const filteredOptions = $derived(() => {
		return fieldOptions.filter((option) => option.fieldGroup === currentGroup());
	});

	// Get trigger content for group selector
	const groupTriggerContent = $derived(() => {
		const groupConfig = FIELD_GROUPS[currentGroup()];
		return groupConfig?.label || 'Selecione o tipo';
	});

	// Get trigger content for field selector
	const fieldTriggerContent = $derived(() => {
		const field = fieldOptions.find((f) => f.id === selectedField);
		return field?.label || 'Selecione um campo';
	});

	function handleGroupChange(newGroup: string | undefined) {
		if (!newGroup || !onGroupChange) return;

		onGroupChange(newGroup as FieldType);

		// Automatically select first field in new group
		const newGroupOptions = fieldOptions.filter(
			(option) => option.fieldGroup === (newGroup as FieldType)
		);
		if (newGroupOptions.length > 0) {
			onFieldChange(newGroupOptions[0].id);
		}
	}

	function handleFieldChange(fieldId: string | undefined) {
		if (!fieldId) return;
		onFieldChange(fieldId);
	}
</script>

<div class="grid grid-cols-2 items-center gap-2 {className}">
	<!-- Field Group Selector -->
	{#if onGroupChange}
		<div class="col-span-1">
			<Select.Root type="single" value={currentGroup()} onValueChange={handleGroupChange}>
				<Select.Trigger class="h-9 w-full">
					{groupTriggerContent()}
				</Select.Trigger>
				<Select.Content>
					{#each Object.entries(FIELD_GROUPS) as [key, config] (key)}
						<Select.Item value={key} class="flex items-center gap-2">
							<div
								class="h-3 w-3 rounded-sm"
								style="background-color: {config.color}; border: 1px solid {config.textColor}20;"
							></div>
							{config.label}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
	{/if}

	<!-- Field Selector -->
	<div class="col-span-1">
		<Select.Root type="single" value={selectedField} onValueChange={handleFieldChange}>
			<Select.Trigger class="h-9 w-full">
				<span class="truncate">{fieldTriggerContent()}</span>
			</Select.Trigger>
			<Select.Content>
				{#each filteredOptions() as field (field.id)}
					{@const groupConfig = FIELD_GROUPS[field.fieldGroup]}
					<Select.Item value={field.id} class="flex items-center gap-2">
						<div
							class="h-2 w-2 flex-shrink-0 rounded-sm"
							style="background-color: {groupConfig.color}; border: 1px solid {groupConfig.textColor}20;"
						></div>
						<span class="flex-1">{field.label}</span>
						{#if field.key}
							<span class="text-xs text-muted-foreground">({field.key})</span>
						{/if}
					</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>
</div>
