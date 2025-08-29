<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { EyeIcon, UsersIcon } from '@lucide/svelte';
	import SegmentRuleBuilder from './segment-rule-builder.svelte';
	import SegmentTemporalSection from './segment-temporal-section.svelte';
	import SegmentLeadsSheet from './segment-leads-sheet.svelte';
	import type {
		RuleGroup,
		TimeFilterType,
		RelativePeriodValue,
		PeriodFilter,
		PeriodValue
	} from '$lib/types/segments';
	import { getLocalTimeZone, fromDate, type DateValue } from '@internationalized/date';
	import { previewSegmentCount } from '$lib/remote/segments.remote';

	type PeriodType = PeriodValue['type'];

	type CustomField = { field_key: string; label: string; type: string };

	interface Props {
		formData: {
			name: string;
			description: string;
			rules: RuleGroup;
			periodFilter: PeriodFilter;
		};
		customFields: CustomField[];
		organizationId: string;
		onFormDataChange?: (formData: Props['formData']) => void;
		showDebugPayload?: boolean;
		children?: import('svelte').Snippet;
	}

	let {
		formData = $bindable(),
		customFields,
		organizationId,
		onFormDataChange,
		showDebugPayload = false,
		children
	}: Props = $props();

	let selectedPeriod = $state<TimeFilterType>(formData.periodFilter.timeFilterType);
	let selectedRelativePeriod = $state<RelativePeriodValue>(
		((formData.periodFilter.periodValue as { type: PeriodType }).type === 'none' ||
		(formData.periodFilter.periodValue as { type: PeriodType }).type === 'automatic'
			? 'none'
			: formData.periodFilter.periodValue.type === 'absolute'
				? 'absolute'
				: formData.periodFilter.periodValue.relativeValue || 'automatic') as RelativePeriodValue
	);

	let isPreviewing = $state(false);
	let previewCount = $state<number | null>(null);
	let isLeadsSheetOpen = $state(false);

	// Watch for external changes to formData and sync local state
	$effect(() => {
		selectedPeriod = formData.periodFilter.timeFilterType;
		selectedRelativePeriod = (
			(formData.periodFilter.periodValue as { type: PeriodType }).type === 'none' ||
			(formData.periodFilter.periodValue as { type: PeriodType }).type === 'automatic'
				? 'none'
				: formData.periodFilter.periodValue.type === 'absolute'
					? 'absolute'
					: formData.periodFilter.periodValue.relativeValue || 'automatic'
		) as RelativePeriodValue;
	});

	// Handle form data changes
	$effect(() => {
		if (onFormDataChange) {
			onFormDataChange(formData);
		}
	});

	// Handle rules change
	function handleRulesChange(newRules: RuleGroup) {
		formData.rules = newRules;
		previewCount = null;
	}

	// Update form data when temporal filters change
	function handleTimeFilterChange(timeFilterType: TimeFilterType) {
		selectedPeriod = timeFilterType;
		formData.periodFilter.timeFilterType = timeFilterType;
		previewCount = null;
	}

	function handleRelativeValueChange(relativeValue: RelativePeriodValue) {
		selectedRelativePeriod = relativeValue;
		// Update the type based on the selected value
		if ((relativeValue as string) === 'none') {
			(formData.periodFilter.periodValue as { type: PeriodType }).type = 'none';
		} else if ((relativeValue as string) === 'absolute') {
			formData.periodFilter.periodValue.type = 'absolute';
			// Initialize with empty dateRange if not present
			if (!formData.periodFilter.periodValue.dateRange) {
				formData.periodFilter.periodValue.dateRange = {
					from: '',
					to: ''
				};
			}
		} else if ((relativeValue as string) === 'automatic') {
			(formData.periodFilter.periodValue as { type: PeriodType }).type = 'automatic';
			formData.periodFilter.periodValue.relativeValue = relativeValue;
		} else {
			formData.periodFilter.periodValue.type = 'relative';
			formData.periodFilter.periodValue.relativeValue = relativeValue;
		}
		previewCount = null;
	}

	function handleDateChange(startDate?: DateValue, endDate?: DateValue) {
		if (formData.periodFilter.periodValue.type === 'absolute') {
			const fromDate = startDate ? startDate.toDate(getLocalTimeZone()) : null;
			const toDate = endDate ? endDate.toDate(getLocalTimeZone()) : null;

			formData.periodFilter.periodValue.dateRange = {
				from: fromDate
					? new Date(
							fromDate.getFullYear(),
							fromDate.getMonth(),
							fromDate.getDate(),
							0,
							0,
							0
						).toISOString()
					: '',
				to: toDate
					? new Date(
							toDate.getFullYear(),
							toDate.getMonth(),
							toDate.getDate(),
							23,
							59,
							59,
							999
						).toISOString()
					: ''
			};
			previewCount = null;
		}
	}

	// Handle preview
	async function handlePreview() {
		if (formData.rules.rules.length === 0) {
			return;
		}

		isPreviewing = true;

		try {
			const result = await previewSegmentCount({
				organizationId,
				rules: JSON.stringify({
					...formData.rules,
					periodFilter: formData.periodFilter
				})
			});
			previewCount = result.previewCount;
		} catch (error) {
			console.error('Preview error:', error);
			previewCount = null;
		} finally {
			isPreviewing = false;
		}
	}
</script>

<div class="space-y-6">
	<!-- Basic Information -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Informações Básicas</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="space-y-2">
				<Label for="name">Nome do Segmento *</Label>
				<Input
					id="name"
					name="name"
					bind:value={formData.name}
					placeholder="Ex: Leads de Alta Conversão"
					required
				/>
			</div>
			<div class="space-y-2">
				<Label for="description">Descrição (opcional)</Label>
				<Textarea
					id="description"
					name="description"
					bind:value={formData.description}
					placeholder="Descreva os critérios e objetivo deste segmento..."
					rows={3}
				/>
			</div>
		</Card.Content>
	</Card.Root>

	<SegmentTemporalSection
		timeFilterType={selectedPeriod}
		relativeValue={selectedRelativePeriod}
		startDate={formData.periodFilter.periodValue.dateRange?.from
			? fromDate(new Date(formData.periodFilter.periodValue.dateRange.from), getLocalTimeZone())
			: undefined}
		endDate={formData.periodFilter.periodValue.dateRange?.to
			? fromDate(new Date(formData.periodFilter.periodValue.dateRange.to), getLocalTimeZone())
			: undefined}
		onTimeFilterChange={handleTimeFilterChange}
		onRelativeValueChange={handleRelativeValueChange}
		onDateChange={handleDateChange}
	/>

	<!-- Rule Builder -->
	<SegmentRuleBuilder rules={formData.rules} {customFields} onRulesChange={handleRulesChange} />

	<!-- Preview Section -->
	{#if formData.rules.rules.length > 0}
		<Card.Root class="py-2">
			<Card.Content class="p-4">
				<div class="flex flex-col gap-2 sm:flex-row sm:justify-between">
					<div class="flex flex-col justify-center">
						<h3 class="font-medium">Preview da Segmentação</h3>
						<p class="text-sm text-muted-foreground">
							Veja quantos leads correspondem aos critérios definidos
						</p>
					</div>
					<div class="flex flex-col gap-4 sm:flex-row">
						{#if previewCount !== null}
							<div class="flex flex-col justify-center text-center sm:text-right">
								<div class="text-2xl font-bold text-primary">
									{previewCount.toLocaleString('pt-BR')}
								</div>
								<div class="text-sm text-muted-foreground">
									lead{previewCount !== 1 ? 's' : ''} encontrado{previewCount !== 1 ? 's' : ''}
								</div>
							</div>
						{/if}
						<div class="flex flex-col gap-2">
							<Button
								type="button"
								variant="outline"
								onclick={handlePreview}
								disabled={isPreviewing || formData.rules.rules.length === 0}
							>
								<EyeIcon class="mr-2 h-4 w-4" />
								{isPreviewing ? 'Carregando...' : 'Pré-visualizar'}
							</Button>
							{#if previewCount !== null && previewCount > 0}
								<Button
									type="button"
									variant="outline"
									onclick={() => (isLeadsSheetOpen = true)}
									disabled={isPreviewing}
								>
									<UsersIcon class="mr-2 h-4 w-4" />
									Ver Leads
								</Button>
							{/if}
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Debug Section (if enabled) -->
	{#if showDebugPayload && children}
		{@render children()}
	{/if}
</div>

<!-- Segment Leads Sheet -->
<SegmentLeadsSheet
	{organizationId}
	rules={formData.rules}
	periodFilter={formData.periodFilter}
	totalCount={previewCount}
	open={isLeadsSheetOpen}
	onOpenChange={(open) => (isLeadsSheetOpen = open)}
/>
