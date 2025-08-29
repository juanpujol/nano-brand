<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { PlusIcon } from '@lucide/svelte';
	import RuleGroupHeader from './rule-group-header.svelte';
	import RuleItem from './rule-item.svelte';
	import { isRule } from '$lib/types/segments';
	import type { RuleGroup, SegmentRule, RuleOperator } from '$lib/types/segments';
	import type { FieldDefinition } from '$lib/types/segment-forms';

	interface Props {
		group: RuleGroup;
		fields: FieldDefinition[];
		onGroupChange: (updates: Partial<RuleGroup>) => void;
		onRemoveGroup: () => void;
	}

	let { group, fields, onGroupChange, onRemoveGroup }: Props = $props();

	// Extract actual rules from the rules array
	const actualRules = $derived(() => {
		return group.rules.filter((rule): rule is SegmentRule => isRule(rule));
	});

	function addRule() {
		// Get first available field for default rule
		const defaultField = fields.length > 0 ? fields[0] : null;
		if (!defaultField) return;

		const newRule: SegmentRule = {
			id: `rule-${Date.now()}`,
			field: defaultField.id,
			operator: (defaultField.operators[0] || 'equals') as RuleOperator,
			value: null,
			fieldGroup: defaultField.fieldGroup
		};

		onGroupChange({
			rules: [...group.rules, newRule]
		});
	}

	function updateRule(ruleId: string, updates: Partial<SegmentRule>) {
		onGroupChange({
			rules: group.rules.map((rule) => {
				if (isRule(rule) && rule.id === ruleId) {
					return { ...rule, ...updates };
				}
				return rule;
			})
		});
	}

	function deleteRule(ruleId: string) {
		onGroupChange({
			rules: group.rules.filter((rule) => {
				if (isRule(rule)) {
					return rule.id !== ruleId;
				}
				return true;
			})
		});
	}

	function updateCombinator(combinator: 'and' | 'or') {
		onGroupChange({ combinator });
	}

	// For now, we won't support deeply nested groups in the nested component
	// This matches the React implementation pattern
</script>

<div class="ml-4 rounded-lg border border-border bg-card p-3">
	<RuleGroupHeader
		combinator={group.combinator}
		onCombinatorChange={updateCombinator}
		onAddRule={addRule}
		{onRemoveGroup}
		isRoot={false}
		compact={false}
	/>

	<div class="mt-3 space-y-2">
		{#each actualRules() as rule, index (rule.id || `nested-rule-${index}`)}
			<RuleItem
				{rule}
				{fields}
				onRuleChange={(updates) => {
					const ruleId = rule.id || `nested-rule-${index}`;
					updateRule(ruleId, updates);
				}}
				onRemoveRule={() => {
					const ruleId = rule.id || `nested-rule-${index}`;
					deleteRule(ruleId);
				}}
			/>
		{/each}

		{#if actualRules().length === 0}
			<Button variant="outline" size="sm" onclick={addRule} class="w-full">
				<PlusIcon class="mr-2 h-4 w-4" />
				Adicionar Regra
			</Button>
		{/if}
	</div>
</div>
