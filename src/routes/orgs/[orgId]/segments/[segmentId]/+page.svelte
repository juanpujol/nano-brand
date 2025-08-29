<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { ChevronLeftIcon, TrashIcon, AlertCircleIcon } from '@lucide/svelte';
	import * as Card from '$lib/components/ui/card';
	import Spinner from '$lib/components/spinner.svelte';
	import SegmentForm from '$lib/components/segment/segment-form.svelte';
	import type {
		RuleGroup,
		TimeFilterType,
		RelativePeriodValue,
		SegmentRule
	} from '$lib/types/segments';
	import { isRule, isRuleGroup } from '$lib/types/segments';
	import type { PageData } from './$types';
	import PayloadDebug from '../payload-debug.svelte';
	import { updateSegment, deleteSegment } from '$lib/remote/segments.remote';

	let { data }: { data: PageData } = $props();

	// Organization data from parent layout
	const orgData = $derived(page.data);

	// Utility function to ensure all rules have IDs
	function normalizeRuleGroup(ruleGroup: RuleGroup): RuleGroup {
		return {
			...ruleGroup,
			id: ruleGroup.id || `group-${Date.now()}`,
			rules: ruleGroup.rules.map((rule, index) => {
				if (isRule(rule)) {
					return {
						...rule,
						id: rule.id || `rule-${Date.now()}-${index}`
					} as SegmentRule;
				} else if (isRuleGroup(rule)) {
					return normalizeRuleGroup(rule);
				}
				return rule;
			})
		};
	}

	// Extract periodFilter from existing segment if it exists
	const existingRuleJson = data.segment.rule_json as RuleGroup;
	const existingPeriodFilter = existingRuleJson.periodFilter;

	// Form state
	let formData = $state({
		name: data.segment.name,
		description: data.segment.description || '',
		rules: normalizeRuleGroup(data.segment.rule_json as RuleGroup),
		periodFilter: existingPeriodFilter || {
			timeFilterType: 'conversion.first' as TimeFilterType,
			periodValue: {
				type: 'relative' as const,
				relativeValue: 'automatic' as RelativePeriodValue
			}
		}
	});

	let isSubmitting = $state(false);
	let isDeleting = $state(false);
	let showDeleteDialog = $state(false);

	// Handle delete
	async function handleDelete() {
		isDeleting = true;
		try {
			await deleteSegment({
				organizationId: page.params.orgId!,
				segmentId: page.params.segmentId!
			});
		} catch (error) {
			console.error('Delete error:', error);
		} finally {
			isDeleting = false;
			showDeleteDialog = false;
		}
	}
</script>

<svelte:head>
	<title
		>Editar {data.segment.name} | {orgData.currentOrganization?.name || 'Organização'} | Laiki</title
	>
</svelte:head>

<div class="mx-auto w-full max-w-4xl space-y-6 p-6">
	<!-- Page Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center space-x-4">
			<Button
				variant="ghost"
				size="sm"
				onclick={() => goto(`/orgs/${page.params.orgId}/segments`)}
				class="h-8 w-8 p-0"
			>
				<ChevronLeftIcon class="h-4 w-4" />
			</Button>
			<div>
				<h1 class="text-2xl font-semibold tracking-tight">Editar Segmento</h1>
				<p class="text-muted-foreground">Modifique os critérios e configurações do segmento</p>
			</div>
		</div>
	</div>

	<!-- Main Form -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Configurações do Segmento</Card.Title>
			<Card.Description>Defina os critérios e regras para este segmento de leads</Card.Description>
		</Card.Header>
		<Card.Content>
			<form {...updateSegment}>
				<SegmentForm
					bind:formData
					customFields={data.customFields}
					organizationId={page.params.orgId!}
					showDebugPayload={true}
				>
					<PayloadDebug {formData} />
				</SegmentForm>

				<input type="hidden" name="organizationId" value={page.params.orgId} />
				<input type="hidden" name="segmentId" value={page.params.segmentId} />
				<input
					type="hidden"
					name="rules"
					value={JSON.stringify({
						...formData.rules,
						periodFilter: formData.periodFilter
					})}
				/>

				<!-- Actions -->
				<div
					class="sticky bottom-0 mt-6 flex items-center justify-end space-x-2 bg-background/80 py-2 backdrop-blur-sm"
				>
					<Button
						type="button"
						variant="outline"
						onclick={() => goto(`/orgs/${page.params.orgId}/segments`)}
					>
						Cancelar
					</Button>
					<Button
						type="submit"
						disabled={isSubmitting || !formData.name.trim() || formData.rules.rules.length === 0}
					>
						{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
					</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>

	<Card.Root class="border-destructive/50 bg-destructive/5">
		<Card.Header>
			<Card.Title class="flex items-center gap-2 text-destructive/80">
				<AlertCircleIcon class="h-5 w-5 text-destructive/80" />
				Área de risco
			</Card.Title>
			<Card.Description class="text-muted-foreground">
				Esta ação não pode ser desfeita. Todos os dados do segmento serão permanentemente removidos.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<Button
				variant="destructive"
				onclick={() => {
					showDeleteDialog = true;
				}}
				disabled={isDeleting}
			>
				<TrashIcon class="mr-2 h-4 w-4" />
				Excluir segmento
			</Button>
		</Card.Content>
	</Card.Root>
</div>

<!-- Delete Confirmation Dialog -->
<AlertDialog.Root bind:open={showDeleteDialog}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Excluir Segmento</AlertDialog.Title>
			<AlertDialog.Description>
				Tem certeza de que deseja excluir o segmento "{data.segment.name}"? Esta ação não pode ser
				desfeita.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => (showDeleteDialog = false)} disabled={isDeleting}>
				Cancelar
			</AlertDialog.Cancel>
			<AlertDialog.Action
				onclick={handleDelete}
				disabled={isDeleting}
				class={buttonVariants({ variant: 'destructive' })}
			>
				{#if isDeleting}
					<Spinner class="mr-2" />
					Excluindo...
				{:else}
					<TrashIcon class="mr-2 h-4 w-4" />
					Excluir
				{/if}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
