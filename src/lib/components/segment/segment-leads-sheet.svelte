<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import FitScoreBadge from '$lib/components/fit-score-badge.svelte';
	import LeadDetailSheet from '$lib/components/lead-detail-sheet.svelte';
	import { LoaderIcon, UsersIcon, BuildingIcon, MailIcon } from '@lucide/svelte';
	import { fetchSegmentLeads } from '$lib/remote/segments.remote';
	import type { Lead } from '$lib/types/leads';
	import type { RuleGroup, PeriodFilter } from '$lib/types/segments';

	interface Props {
		organizationId: string;
		rules: RuleGroup;
		periodFilter?: PeriodFilter;
		totalCount: number | null;
		open: boolean;
		onOpenChange: (open: boolean) => void;
	}

	let { organizationId, rules, periodFilter, totalCount, open, onOpenChange }: Props = $props();

	// Leads state
	let leads = $state<Lead[]>([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	// Lead detail sheet state
	let selectedLead = $state<Lead | null>(null);
	let isLeadSheetOpen = $state(false);

	function openLeadDetail(lead: Lead) {
		selectedLead = lead;
		isLeadSheetOpen = true;
	}

	function closeLeadDetail() {
		isLeadSheetOpen = false;
		selectedLead = null;
	}

	// Fetch leads using segment rules
	async function fetchLeads() {
		if (!organizationId || !rules || rules.rules.length === 0) {
			leads = [];
			return;
		}

		isLoading = true;
		error = null;

		try {
			// Since fetchSegmentLeads reads from URL searchParams, we need to temporarily
			// modify the URL to pass our desired parameters
			const originalUrl = window.location.href;
			const url = new URL(originalUrl);

			// Set our desired parameters
			url.searchParams.set('limit', '100');
			url.searchParams.set('offset', '0');
			url.searchParams.set('orderBy', 'created_at DESC');

			// Temporarily update the URL (without adding to history)
			history.replaceState(null, '', url.href);

			try {
				const result = await fetchSegmentLeads({
					organizationId,
					rules: JSON.stringify({ ...rules, periodFilter })
				});

				leads = result.leads;
			} finally {
				// Restore the original URL
				history.replaceState(null, '', originalUrl);
			}
		} catch (err) {
			console.error('Error fetching segment leads:', err);
			error = err instanceof Error ? err.message : 'Erro ao buscar leads';
			leads = [];
		} finally {
			isLoading = false;
		}
	}

	// Fetch leads when sheet opens or rules change
	$effect(() => {
		if (open && rules) {
			fetchLeads();
		} else if (!open) {
			// Clear data when sheet closes
			leads = [];
			error = null;
			isLoading = false;
		}
	});

	function formatDate(dateString: string | null | undefined): string {
		if (!dateString) return '-';
		try {
			return new Date(dateString).toLocaleDateString('pt-BR');
		} catch {
			return '-';
		}
	}
</script>

<Sheet.Root {open} {onOpenChange}>
	<Sheet.Content class="w-full gap-0 overflow-auto sm:max-w-lg">
		<Sheet.Header class="sticky top-0 z-10 bg-background">
			<Sheet.Title class="flex items-center gap-2">
				<UsersIcon class="h-5 w-5" />
				Leads do Segmento
			</Sheet.Title>
			<Sheet.Description>
				{#if isLoading}
					Carregando leads...
				{:else if error}
					{error}
				{:else if totalCount && totalCount > 100}
					Mostrando os primeiros 100 de {totalCount.toLocaleString('pt-BR')} leads
				{:else if leads.length > 0}
					{leads.length} lead{leads.length !== 1 ? 's' : ''} encontrado{leads.length !== 1
						? 's'
						: ''}
				{:else}
					Visualize os leads que correspondem aos critérios
				{/if}
			</Sheet.Description>
		</Sheet.Header>

		<div class="px-4 pb-4">
			{#if isLoading}
				<div class="flex items-center justify-center py-8">
					<LoaderIcon class="h-6 w-6 animate-spin text-muted-foreground" />
					<span class="ml-2 text-muted-foreground">Carregando leads...</span>
				</div>
			{:else if error}
				<div class="flex flex-col items-center justify-center py-8">
					<p class="mb-2 text-sm text-destructive">{error}</p>
					<Button variant="outline" size="sm" onclick={fetchLeads}>Tentar novamente</Button>
				</div>
			{:else if leads.length === 0}
				<div class="flex flex-col items-center justify-center py-8 text-center">
					<UsersIcon class="mb-2 h-12 w-12 text-muted-foreground" />
					<p class="text-sm text-muted-foreground">Nenhum lead encontrado para estes critérios</p>
				</div>
			{:else}
				<div class="space-y-2">
					{#each leads as lead (lead.id)}
						<Card.Root
							class="cursor-pointer py-0 transition-colors hover:bg-muted/50"
							onclick={() => openLeadDetail(lead)}
						>
							<Card.Content class="p-4">
								<div class="flex items-start justify-between">
									<div class="flex-1 space-y-2">
										<!-- Lead name and fit score -->
										<div class="flex items-center gap-2">
											<h3 class="text-sm font-medium">{lead.name || 'Lead sem nome'}</h3>
										</div>

										<!-- Company and email -->
										<div class="flex flex-col gap-1 text-sm text-muted-foreground">
											{#if lead.company}
												<div class="flex items-center gap-1">
													<BuildingIcon class="h-3 w-3" />
													<span>{lead.company}</span>
												</div>
											{/if}
											{#if lead.email}
												<div class="flex items-center gap-1">
													<MailIcon class="h-3 w-3" />
													<span>{lead.email}</span>
												</div>
											{/if}
										</div>

										<!-- Tags if any -->
										{#if lead.tags && lead.tags.length > 0}
											<div class="flex flex-wrap gap-1">
												{#each lead.tags.slice(0, 3) as tag, index (tag + index)}
													<Badge variant="secondary" class="text-xs">
														{tag}
													</Badge>
												{/each}
												{#if lead.tags.length > 3}
													<Badge variant="outline" class="text-xs">
														+{lead.tags.length - 3}
													</Badge>
												{/if}
											</div>
										{/if}
									</div>
									<div class="flex flex-col items-end gap-2">
										<!-- Created date -->
										<div class="text-xs text-muted-foreground">
											{formatDate(lead.created_at)}
										</div>
										<FitScoreBadge fitScore={lead.fit_score} />
									</div>
								</div>

								<!-- Conversion info if available -->
								{#if lead.total_conversions && lead.total_conversions > 0}
									<hr class="my-3" />
									<div class="flex items-center gap-4 text-xs text-muted-foreground">
										<span class="font-medium">
											{lead.total_conversions} conversão{lead.total_conversions !== 1 ? 'ões' : ''}
										</span>
										{#if lead.last_conversion_date}
											<span>
												Última: {formatDate(lead.last_conversion_date)}
											</span>
										{/if}
									</div>
								{/if}
							</Card.Content>
						</Card.Root>
					{/each}

					<!-- Info about showing first 100 if there are more -->
					{#if totalCount && totalCount > leads.length}
						<div class="mt-4 rounded-md bg-muted p-3 text-center">
							<p class="text-sm text-muted-foreground">
								Mostrando os primeiros {leads.length} leads de {totalCount.toLocaleString('pt-BR')} total.
								<br />
								Para ver todos os leads, salve o segmento e acesse a página de leads com filtros.
							</p>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Lead Detail Sheet -->
<LeadDetailSheet lead={selectedLead} open={isLeadSheetOpen} onOpenChange={closeLeadDetail} />
