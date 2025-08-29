<script lang="ts">
	// Re-export the new modular rule builder
	import RuleBuilder from './rule-builder/index.svelte';
	import type { RuleGroup } from '$lib/types/segments';

	interface Props {
		rules: RuleGroup;
		customFields?: Array<{ field_key: string; label: string; type: string }>;
		onRulesChange: (rules: RuleGroup) => void;
		hideHeader?: boolean;
	}

	let { rules, customFields = [], onRulesChange, hideHeader = false }: Props = $props();
</script>

<RuleBuilder {rules} {customFields} {onRulesChange} {hideHeader} />
