<script lang="ts">
	import { FilterIcon, PlusIcon } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import RuleGroupHeader from './rule-group-header.svelte';
	import RuleItem from './rule-item.svelte';
	import NestedRuleGroup from './nested-rule-group.svelte';
	import { isRule, isRuleGroup } from '$lib/types/segments';
	import { buildLeadsCustomFieldDefinition } from '$lib/types/segment-forms';
	import type { RuleGroup, SegmentRule, RuleOperator } from '$lib/types/segments';
	import type { FieldDefinition } from '$lib/types/segment-forms';
	import { LEAD_FIELDS, CONVERSION_FIELDS } from './field-definitions';

	interface Props {
		rules: RuleGroup;
		customFields?: Array<{ field_key: string; label: string; type: string }>;
		onRulesChange: (rules: RuleGroup) => void;
		hideHeader?: boolean;
	}

	let { rules, customFields = [], onRulesChange, hideHeader = false }: Props = $props();

	// Build complete field options including custom fields
	const allFields = $derived(() => {
		const customFieldOptions: FieldDefinition[] = customFields.map((field) =>
			buildLeadsCustomFieldDefinition(field)
		);

		// Combine all field definitions
		let allFieldDefs = [...LEAD_FIELDS, ...CONVERSION_FIELDS];
		if (customFields.length > 0) {
			allFieldDefs = [...allFieldDefs, ...customFieldOptions];
		}

		return allFieldDefs;
	});

	// Extract actual rules and nested groups from the main rules
	const actualRules = $derived(() => {
		return rules.rules.filter((rule): rule is SegmentRule => isRule(rule));
	});

	const nestedGroups = $derived(() => {
		// Check both rules array and legacy groups property
		const rulesGroups = rules.rules.filter((rule): rule is RuleGroup => isRuleGroup(rule));
		const legacyGroups = rules.groups || [];
		// Put legacy groups first to maintain their position, then new groups
		return [...legacyGroups, ...rulesGroups];
	});

	// Calculate total rules count
	const totalRules = $derived(() => {
		const directRules = actualRules().length;
		const groupRules = nestedGroups().reduce((acc, group) => {
			return acc + group.rules.filter((rule) => isRule(rule)).length;
		}, 0);
		return directRules + groupRules;
	});

	function addRule() {
		// Use first available field as default
		const defaultField = allFields().length > 0 ? allFields()[0] : null;
		if (!defaultField) {
			console.warn('[RuleEngine] No fields available to create rule');
			return;
		}

		// Ensure we have a valid operator
		const defaultOperator = (defaultField.operators[0] || 'equals') as RuleOperator;

		const newRule: SegmentRule = {
			id: `rule-${Date.now()}`,
			field: defaultField.id,
			operator: defaultOperator,
			value: null,
			fieldGroup: defaultField.fieldGroup
		};

		const updatedRules: RuleGroup = {
			...rules,
			rules: [...rules.rules, newRule]
		};

		onRulesChange(updatedRules);
	}

	function addGroup() {
		const newGroup: RuleGroup = {
			id: `group-${Date.now()}`,
			combinator: 'and',
			rules: []
		};

		const updatedRules: RuleGroup = {
			...rules,
			rules: [...rules.rules, newGroup]
		};

		onRulesChange(updatedRules);
	}

	function updateRule(ruleId: string, updates: Partial<SegmentRule>) {
		const updatedRules: RuleGroup = {
			...rules,
			rules: rules.rules.map((rule) => {
				if (isRule(rule) && rule.id === ruleId) {
					return { ...rule, ...updates };
				}
				return rule;
			})
		};

		onRulesChange(updatedRules);
	}

	function deleteRule(ruleId: string) {
		const updatedRules: RuleGroup = {
			...rules,
			rules: rules.rules.filter((rule) => {
				if (isRule(rule)) {
					return rule.id !== ruleId;
				}
				return true;
			})
		};

		onRulesChange(updatedRules);
	}

	function updateGroup(groupId: string, updates: Partial<RuleGroup>) {
		const updatedRules: RuleGroup = {
			...rules,
			rules: rules.rules.map((rule) => {
				if (isRuleGroup(rule) && rule.id === groupId) {
					return { ...rule, ...updates };
				}
				return rule;
			}),
			// Also handle legacy groups property
			groups: rules.groups?.map((group) =>
				group.id === groupId ? { ...group, ...updates } : group
			)
		};

		onRulesChange(updatedRules);
	}

	function deleteGroup(groupId: string) {
		const updatedRules: RuleGroup = {
			...rules,
			rules: rules.rules.filter((rule) => {
				if (isRuleGroup(rule)) {
					return rule.id !== groupId;
				}
				return true;
			}),
			// Also handle legacy groups property
			groups: rules.groups?.filter((group) => group.id !== groupId)
		};

		onRulesChange(updatedRules);
	}

	function updateCombinator(combinator: 'and' | 'or') {
		const updatedRules: RuleGroup = {
			...rules,
			combinator
		};

		onRulesChange(updatedRules);
	}
</script>

<Card.Root class="space-y-4 p-4">
	{#if !hideHeader}
		<div class="flex items-center justify-between">
			<div class="flex items-center space-x-2">
				<FilterIcon class="h-5 w-5 text-muted-foreground" />
				<h3 class="text-lg font-medium">Construtor de regras</h3>
			</div>
			<div class="text-sm text-muted-foreground">
				{totalRules()}
				{totalRules() === 1 ? 'regra' : 'regras'}
			</div>
		</div>
	{/if}

	<div>
		<RuleGroupHeader
			combinator={rules.combinator}
			onCombinatorChange={updateCombinator}
			onAddRule={addRule}
			onAddGroup={addGroup}
			isRoot={true}
		/>

		<div class="mt-4 space-y-3">
			<!-- Direct rules -->
			{#each actualRules() as rule, index (rule.id || `rule-${index}`)}
				<RuleItem
					{rule}
					fields={allFields()}
					onRuleChange={(updates) => {
						const ruleId = rule.id || `rule-${index}`;
						updateRule(ruleId, updates);
					}}
					onRemoveRule={() => {
						const ruleId = rule.id || `rule-${index}`;
						deleteRule(ruleId);
					}}
				/>
			{/each}

			<!-- Nested groups -->
			{#each nestedGroups() as group, index (group.id || `group-${index}`)}
				<NestedRuleGroup
					{group}
					fields={allFields()}
					onGroupChange={(updates) => {
						const groupId = group.id || `group-${index}`;
						updateGroup(groupId, updates);
					}}
					onRemoveGroup={() => {
						const groupId = group.id || `group-${index}`;
						deleteGroup(groupId);
					}}
				/>
			{/each}

			<!-- Empty state -->
			{#if actualRules().length === 0 && nestedGroups().length === 0}
				<Button variant="outline" size="sm" onclick={addRule} class="w-full">
					<PlusIcon class="mr-2 h-4 w-4" />
					Adicionar Regra
				</Button>
			{/if}
		</div>
	</div>
</Card.Root>
