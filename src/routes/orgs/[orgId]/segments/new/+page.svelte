<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { ChevronLeftIcon } from '@lucide/svelte';
	import SegmentForm from '$lib/components/segment/segment-form.svelte';
	import type { RuleGroup } from '$lib/types/segments';
	import type { TimeFilterType, RelativePeriodValue } from '$lib/types/segments';
	import type { PageData } from './$types';
	import PayloadDebug from '../payload-debug.svelte';
	import { createSegment } from '$lib/remote/segments.remote';

	let { data }: { data: PageData } = $props();

	// Organization data from parent layout
	const orgData = $derived(page.data);

	// Form state
	let formData = $state({
		name: '',
		description: '',
		rules: {
			combinator: 'and' as const,
			rules: []
		} as RuleGroup,
		periodFilter: {
			timeFilterType: 'conversion.first' as TimeFilterType,
			periodValue: {
				type: 'relative' as const,
				relativeValue: 'automatic' as RelativePeriodValue
			}
		}
	});

	let stringifiedRules = $derived(
		JSON.stringify({
			...formData.rules,
			periodFilter: formData.periodFilter
		})
	);

	let isSubmitting = $state(false);
</script>

<svelte:head>
	<title>Novo Segmento | {orgData.currentOrganization?.name || 'Organização'} | Laiki</title>
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
				<h1 class="text-2xl font-semibold tracking-tight">Novo Segmento</h1>
				<p class="text-muted-foreground">Crie um novo segmento para organizar seus leads</p>
			</div>
		</div>
	</div>

	<!-- Main Form -->
	<form {...createSegment}>
		<SegmentForm
			bind:formData
			customFields={data.customFields}
			organizationId={page.params.orgId!}
			showDebugPayload={true}
		>
			<PayloadDebug {formData} />
		</SegmentForm>

		<input type="hidden" name="organizationId" value={page.params.orgId} />
		<input type="hidden" name="rules" bind:value={stringifiedRules} />

		<!-- Actions -->
		<div class="mt-6 flex items-center justify-end space-x-2">
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
				{isSubmitting ? 'Criando...' : 'Criar Segmento'}
			</Button>
		</div>
	</form>
</div>
