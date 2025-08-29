<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import * as Card from '$lib/components/ui/card';
	import LeadInfoCard from '$lib/components/lead-info-card.svelte';
	import UtmCard from '$lib/components/utm-card.svelte';
	import LeadDetailSheet from '$lib/components/lead-detail-sheet.svelte';
	import {
		DollarSignIcon,
		CalendarIcon,
		IdCardIcon,
		MapPinIcon,
		MonitorIcon,
		LinkIcon,
		ExternalLinkIcon,
		BracketsIcon,
		ChevronDownIcon,
		ChevronRightIcon,
		LoaderIcon
	} from '@lucide/svelte';
	import type { Conversion } from '$lib/types/conversions';
	import type { Lead } from '$lib/types/leads';
	import { Button } from '$lib/components/ui/button';
	import { getLeadForConversion } from '$lib/remote/leads.remote';

	interface Props {
		conversion: Conversion | null;
		open: boolean;
		onOpenChange: (open: boolean) => void;
	}

	let { conversion, open, onOpenChange }: Props = $props();

	// Lead data state
	let leadData = $state<Lead | null>(null);
	let isLoadingLead = $state(false);
	let leadError = $state<string | null>(null);
	let leadFetched = $state(false);

	// JSON viewer state
	let isJsonExpanded = $state(false);

	// Lead detail sheet state
	let isLeadSheetOpen = $state(false);

	function openLeadDetail() {
		if (leadData) {
			isLeadSheetOpen = true;
		}
	}

	function closeLeadDetail() {
		isLeadSheetOpen = false;
	}

	// Fetch lead data for the conversion
	async function fetchLeadData(leadId: string) {
		if (!leadId) {
			leadData = null;
			isLoadingLead = false;
			return;
		}

		isLoadingLead = true;
		leadError = null;

		try {
			leadData = await getLeadForConversion({ leadId });
		} catch (err) {
			console.error('Error fetching lead data:', err);
			leadError = err instanceof Error ? err.message : 'Erro ao carregar dados do lead';
			leadData = null;
		}

		leadFetched = true;
		isLoadingLead = false;
	}

	// Fetch data when sheet opens
	$effect(() => {
		if (conversion?.lead_id && open) {
			if (!leadFetched && !isLoadingLead) {
				fetchLeadData(conversion.lead_id);
			}
		} else if (!open) {
			// Clear data when sheet closes
			leadData = null;
			leadError = null;
			isLoadingLead = false;
			leadFetched = false;
			isJsonExpanded = false;
			isLeadSheetOpen = false;
		}
	});

	function formatDate(dateString: string | null | undefined): string {
		if (!dateString) return '-';
		try {
			const date = new Date(dateString);
			return date
				.toLocaleDateString('pt-BR', {
					day: '2-digit',
					month: '2-digit',
					year: 'numeric',
					hour: '2-digit',
					minute: '2-digit'
				})
				.replace(',', ' às');
		} catch {
			return dateString;
		}
	}

	function formatValue(value: number | null | undefined): string {
		if (!value) return '-';
		return `R$ ${value.toLocaleString('pt-BR')}`;
	}

	function formatJson(json: Record<string, unknown> | null): string {
		if (!json) return '{}';
		return JSON.stringify(json, null, 2);
	}
</script>

<Sheet.Root {open} {onOpenChange}>
	<Sheet.Content class="w-full gap-0 overflow-auto sm:max-w-md">
		<Sheet.Header class="sticky top-0 z-10">
			<Sheet.Title>{conversion?.name || 'Conversão sem nome'}</Sheet.Title>
			<Sheet.Description>
				Data: {formatDate(conversion?.date)}
			</Sheet.Description>
		</Sheet.Header>

		<div class="space-y-4 px-4">
			<!-- Informações Principais -->
			<Card.Root class="gap-4">
				<Card.Header>
					<Card.Title class="text-base">Informações principais</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-3">
					<div class="flex gap-3">
						<IdCardIcon class="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
						<div class="flex min-w-0 flex-col">
							<span class="text-sm font-medium text-muted-foreground">Nome da Conversão</span>
							<p class="truncate text-sm">{conversion?.name || '-'}</p>
						</div>
					</div>

					<div class="flex gap-3">
						<DollarSignIcon class="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
						<div class="flex min-w-0 flex-col">
							<span class="text-sm font-medium text-muted-foreground">Valor da Conversão</span>
							<p class="truncate text-sm">{formatValue(conversion?.value)}</p>
						</div>
					</div>

					<div class="flex gap-3">
						<CalendarIcon class="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
						<div class="flex min-w-0 flex-col">
							<span class="text-sm font-medium text-muted-foreground">Data da Conversão</span>
							<p class="truncate text-sm">{formatDate(conversion?.date)}</p>
						</div>
					</div>

					<div class="flex gap-3">
						<IdCardIcon class="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
						<div class="flex min-w-0 flex-col">
							<span class="text-sm font-medium text-muted-foreground">ID da Conversão</span>
							<p class="truncate rounded bg-muted px-2 py-1 font-mono text-xs">
								{conversion?.id}
							</p>
						</div>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Lead Associado -->
			{#if isLoadingLead}
				<Card.Root class="gap-4">
					<Card.Header>
						<Card.Title class="text-base">Lead associado</Card.Title>
					</Card.Header>
					<Card.Content>
						<div class="py-8 text-center text-muted-foreground">
							<LoaderIcon class="mx-auto mb-4 h-6 w-6 animate-spin" />
							<p class="text-sm">Carregando dados do lead...</p>
						</div>
					</Card.Content>
				</Card.Root>
			{:else if leadError}
				<Card.Root class="gap-4">
					<Card.Header>
						<Card.Title class="text-base">Lead associado</Card.Title>
					</Card.Header>
					<Card.Content>
						<div class="py-8 text-center text-destructive">
							<p class="text-sm">{leadError}</p>
						</div>
					</Card.Content>
				</Card.Root>
			{:else if leadData}
				<LeadInfoCard lead={leadData} title="Lead associado" />

				<div>
					<Button variant="outline" onclick={openLeadDetail}>Ver detalhes do lead</Button>
				</div>
			{/if}

			<!-- Origem do Tráfego -->
			<UtmCard
				title="Origem do tráfego"
				utmSource={conversion?.utm_source || null}
				utmMedium={conversion?.utm_medium || null}
				utmCampaign={conversion?.utm_campaign || null}
				utmTerm={conversion?.utm_term || null}
				utmContent={conversion?.utm_content || null}
			/>

			<!-- Informações Técnicas -->
			<Card.Root class="gap-4">
				<Card.Header>
					<Card.Title class="text-base">Informações técnicas</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-3">
					<div class="flex gap-3">
						<MonitorIcon class="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
						<div class="flex min-w-0 flex-col">
							<span class="text-sm font-medium text-muted-foreground">Dispositivo</span>
							<p class="truncate text-sm">{conversion?.device || '-'}</p>
						</div>
					</div>

					<div class="flex gap-3">
						<LinkIcon class="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
						<div class="flex min-w-0 flex-col">
							<span class="text-sm font-medium text-muted-foreground">Domínio</span>
							<p class="truncate text-sm">{conversion?.conversion_domain || '-'}</p>
						</div>
					</div>

					<div class="flex gap-3">
						<ExternalLinkIcon class="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
						<div class="flex min-w-0 flex-col">
							<span class="text-sm font-medium text-muted-foreground">URL da Conversão</span>
							{#if conversion?.conversion_url}
								<a
									href={conversion.conversion_url}
									target="_blank"
									rel="noopener noreferrer"
									class="truncate text-sm text-blue-600 hover:text-blue-800"
								>
									{conversion.conversion_url}
								</a>
							{:else}
								<p class="text-sm">-</p>
							{/if}
						</div>
					</div>

					<div class="flex gap-3">
						<IdCardIcon class="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
						<div class="flex min-w-0 flex-col">
							<span class="text-sm font-medium text-muted-foreground">Identificador</span>
							<p class="truncate text-sm">{conversion?.identifier || '-'}</p>
						</div>
					</div>

					<div class="flex gap-3">
						<MapPinIcon class="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
						<div class="flex min-w-0 flex-col">
							<span class="text-sm font-medium text-muted-foreground">Origem</span>
							<p class="truncate text-sm">{conversion?.external_source || '-'}</p>
						</div>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Dados Brutos (JSON) -->
			{#if conversion?.raw_payload}
				<Card.Root class="gap-4">
					<Card.Header>
						<Card.Title class="text-base">Dados brutos (JSON)</Card.Title>
					</Card.Header>
					<Card.Content>
						<div class="space-y-2">
							<button
								class="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
								onclick={() => (isJsonExpanded = !isJsonExpanded)}
							>
								{#if isJsonExpanded}
									<ChevronDownIcon class="h-4 w-4" />
									Ocultar dados
								{:else}
									<ChevronRightIcon class="h-4 w-4" />
									Mostrar dados
								{/if}
								<BracketsIcon class="h-4 w-4" />
							</button>

							{#if isJsonExpanded}
								<div class="rounded-md border bg-muted/50 p-3">
									<pre
										class="max-h-96 overflow-auto font-mono text-xs whitespace-pre-wrap">{formatJson(
											conversion.raw_payload
										)}</pre>
								</div>
							{/if}
						</div>
					</Card.Content>
				</Card.Root>
			{/if}
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Lead Detail Sheet (stacked) -->
{#if leadData}
	<LeadDetailSheet lead={leadData} open={isLeadSheetOpen} onOpenChange={closeLeadDetail} />
{/if}
