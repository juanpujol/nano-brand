<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import FitScoreBadge from '$lib/components/fit-score-badge.svelte';
	import LeadDetailSheet from '$lib/components/lead-detail-sheet.svelte';
	import { LoaderIcon, UsersIcon, BuildingIcon, MailIcon } from '@lucide/svelte';
	import type { LeadsCustomFieldDefinition } from '$lib/schemas/custom-fields';
	import type { Lead } from '$lib/types/leads';
	import { getLeadsWithCustomField } from '$lib/remote/leads.remote';
	import { ArrowRightIcon } from 'lucide-svelte';

	interface LeadWithCustomField extends Lead {
		field_value: string;
	}

	interface Props {
		customField: LeadsCustomFieldDefinition | null;
		open: boolean;
		onOpenChange: (open: boolean) => void;
	}

	let { customField, open, onOpenChange }: Props = $props();

	// Leads state
	let leads = $state<LeadWithCustomField[]>([]);
	let isLoading = $state(false);
	let isLoadingMore = $state(false);
	let error = $state<string | null>(null);
	let offset = $state(0);
	let totalCount = $state(0);
	let hasMore = $state(false);
	const LIMIT = 25;

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

	// Fetch leads with this custom field using remote function
	async function fetchLeads(reset = true) {
		if (!customField?.field_key || !customField?.organization_id) {
			leads = [];
			return;
		}

		if (reset) {
			isLoading = true;
			offset = 0;
			leads = [];
		} else {
			isLoadingMore = true;
		}

		error = null;

		try {
			const result = await getLeadsWithCustomField({
				fieldKey: customField.field_key,
				organizationId: customField.organization_id,
				offset: offset.toString(),
				limit: LIMIT.toString(),
				totalCount: (customField.usage_count || 0).toString()
			});

			if (reset) {
				leads = result.leads;
			} else {
				leads = [...leads, ...result.leads];
			}

			if (reset) {
				totalCount = customField.usage_count || 0;
			}
			offset += LIMIT;
			hasMore = leads.length < totalCount;
		} catch (err) {
			console.error('Error fetching leads with custom field:', err);
			error = err instanceof Error ? err.message : 'Erro interno';
			if (reset) {
				leads = [];
			}
		} finally {
			isLoading = false;
			isLoadingMore = false;
		}
	}

	async function loadMore() {
		await fetchLeads(false);
	}

	// Track previous open state and field key to detect changes
	let prevOpen = $state(false);
	let prevFieldKey = $state<string | null>(null);

	$effect(() => {
		// Only react to open/close and field changes, not the fetch itself
		if (open && !prevOpen && customField?.field_key && customField?.organization_id) {
			// Sheet just opened
			fetchLeads();
		} else if (open && customField?.field_key !== prevFieldKey && customField?.field_key) {
			// Field changed while sheet is open
			fetchLeads();
		} else if (!open && prevOpen) {
			// Sheet just closed
			leads = [];
			error = null;
			isLoading = false;
			isLoadingMore = false;
			offset = 0;
			totalCount = 0;
			hasMore = false;
		}

		// Update tracking variables
		prevOpen = open;
		prevFieldKey = customField?.field_key || null;
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
				Leads com "{customField?.label || 'Campo'}"
			</Sheet.Title>
			<Sheet.Description>
				{#if isLoading}
					Carregando leads...
				{:else if error}
					{error}
				{:else if totalCount > 0}
					Mostrando {leads.length} de {totalCount} lead{totalCount !== 1 ? 's' : ''} usando este campo
				{:else}
					Nenhum lead usando este campo
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
					<Button variant="outline" size="sm" onclick={() => fetchLeads()}>Tentar novamente</Button>
				</div>
			{:else if leads.length === 0}
				<div class="flex flex-col items-center justify-center py-8 text-center">
					<UsersIcon class="mb-2 h-12 w-12 text-muted-foreground" />
					<p class="text-sm text-muted-foreground">
						Nenhum lead está usando este campo personalizado
					</p>
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
									<div class="max-w-2/3 flex-1 space-y-2">
										<!-- Lead name and fit score -->
										<div class="flex items-center gap-2">
											<h3 class="text-sm font-medium">{lead.name || 'Lead sem nome'}</h3>
										</div>

										<!-- Company and email -->
										<div class="flex flex-col gap-1 text-sm text-muted-foreground">
											{#if lead.company}
												<div class="flex w-full items-center gap-1">
													<BuildingIcon class="h-3 w-3" />
													<span class="truncate">{lead.company}</span>
												</div>
											{/if}
											{#if lead.email}
												<div class="flex w-full items-center gap-1">
													<MailIcon class="h-3 w-3" />
													<span class="truncate">{lead.email}</span>
												</div>
											{/if}
										</div>
									</div>
									<div class="flex flex-col items-end gap-2">
										<!-- Created date -->
										<div class="text-sm text-muted-foreground">
											{formatDate(lead.created_at)}
										</div>
										<FitScoreBadge fitScore={lead.fit_score} />
									</div>
								</div>

								<hr class="my-4" />

								<!-- Custom field value -->
								<div class="flex flex-col gap-2">
									<span>
										<code
											class="rounded bg-muted px-2 py-1 font-mono text-sm text-muted-foreground"
										>
											{customField?.label}
										</code>
									</span>
									<span class="flex items-center gap-2 text-sm">
										<ArrowRightIcon class="h-4 w-4 text-muted-foreground" />
										{lead.field_value || '-'}
									</span>
								</div>
							</Card.Content>
						</Card.Root>
					{/each}

					<!-- Load More Button -->
					{#if hasMore}
						<div class="flex justify-center pt-4">
							<Button variant="outline" onclick={loadMore} disabled={isLoadingMore} class="w-full">
								{#if isLoadingMore}
									<LoaderIcon class="mr-2 h-4 w-4 animate-spin" />
									Carregando...
								{:else}
									Carregar mais 25 leads
								{/if}
							</Button>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Lead Detail Sheet -->
<LeadDetailSheet lead={selectedLead} open={isLeadSheetOpen} onOpenChange={closeLeadDetail} />
