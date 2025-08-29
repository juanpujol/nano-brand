<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { PlusIcon, TrashIcon, UsersIcon, ZapIcon } from '@lucide/svelte';
	import type { Combinator } from '$lib/types/segments';

	interface Props {
		combinator: Combinator;
		onCombinatorChange: (combinator: Combinator) => void;
		onAddRule?: () => void;
		onAddGroup?: () => void;
		onRemoveGroup?: () => void;
		isRoot?: boolean;
		compact?: boolean;
	}

	let {
		combinator,
		onCombinatorChange,
		onAddRule,
		onAddGroup,
		onRemoveGroup,
		isRoot = true,
		compact = false
	}: Props = $props();

	// Combinator display configuration
	const combinatorConfig = $derived(() => {
		return combinator === 'and'
			? {
					text: 'E',
					bgColor: 'bg-blue-50 dark:bg-blue-950/30',
					textColor: 'text-blue-700 dark:text-blue-300',
					hoverColor: 'hover:bg-blue-100 dark:hover:bg-blue-900/40'
				}
			: {
					text: 'OU',
					bgColor: 'bg-amber-50 dark:bg-amber-950/30',
					textColor: 'text-amber-700 dark:text-amber-300',
					hoverColor: 'hover:bg-amber-100 dark:hover:bg-amber-900/40'
				};
	});

	function toggleCombinator() {
		onCombinatorChange(combinator === 'and' ? 'or' : 'and');
	}
</script>

{#if compact}
	<!-- Compact layout -->
	<div class="flex flex-wrap items-center gap-1">
		<!-- Combinator button -->
		<Button
			variant="ghost"
			size="sm"
			onclick={toggleCombinator}
			class="h-6 px-2 py-0 text-xs {combinatorConfig().bgColor} {combinatorConfig()
				.textColor} {combinatorConfig().hoverColor}"
		>
			<ZapIcon class="mr-1 h-3 w-3" />
			{combinatorConfig().text}
		</Button>

		<!-- Action buttons -->
		<div class="ml-auto flex items-center gap-1">
			{#if onAddRule}
				<Button variant="ghost" size="sm" onclick={onAddRule} class="h-6 w-6 p-0">
					<PlusIcon class="h-3 w-3" />
					<span class="sr-only">Adicionar regra</span>
				</Button>
			{/if}

			{#if onRemoveGroup}
				<Button
					variant="ghost"
					size="icon"
					onclick={onRemoveGroup}
					class="h-6 w-6 text-destructive hover:bg-destructive/10 hover:text-destructive/80"
				>
					<TrashIcon class="h-3 w-3" />
					<span class="sr-only">Remover grupo</span>
				</Button>
			{/if}
		</div>
	</div>
{:else}
	<!-- Standard layout -->
	<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
		<!-- Combinator button -->
		<Button
			variant="ghost"
			onclick={toggleCombinator}
			class="h-8 px-3 py-1 text-sm {combinatorConfig().bgColor} {combinatorConfig()
				.textColor} {combinatorConfig().hoverColor}"
		>
			<ZapIcon class="mr-2 h-3 w-3" />
			{combinatorConfig().text}
		</Button>

		<!-- Action buttons -->
		<div class="ml-auto flex items-center gap-2">
			{#if onAddRule}
				<Button variant="outline" size="sm" onclick={onAddRule} class="h-8 text-xs">
					<PlusIcon class="mr-1 h-3 w-3" />
					Adicionar regra
				</Button>
			{/if}

			{#if onAddGroup && isRoot}
				<Button variant="outline" size="sm" onclick={onAddGroup} class="h-8 text-xs">
					<UsersIcon class="mr-1 h-3 w-3" />
					Adicionar grupo
				</Button>
			{/if}

			{#if onRemoveGroup}
				<Button
					variant="ghost"
					size="icon"
					onclick={onRemoveGroup}
					class="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive/80"
				>
					<TrashIcon class="h-3 w-3" />
					<span class="sr-only">Remover grupo</span>
				</Button>
			{/if}
		</div>
	</div>
{/if}
