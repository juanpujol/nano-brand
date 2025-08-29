<script lang="ts">
	import * as Card from '$lib/components/ui/card';

	import type { RuleGroup, PeriodFilter } from '$lib/types/segments';

	let { formData } = $props<{
		formData: {
			name: string;
			description: string;
			rules: RuleGroup;
			periodFilter?: PeriodFilter;
		};
	}>();
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Debug: Dados que serão enviados</Card.Title>
	</Card.Header>
	<Card.Content>
		<pre class="max-h-40 overflow-auto rounded bg-background p-3 text-xs">
{JSON.stringify(
				{
					name: formData.name,
					description: formData.description,
					rules: {
						...formData.rules,
						periodFilter: formData.periodFilter
					}
				},
				null,
				2
			)}
    </pre>
	</Card.Content>
</Card.Root>
