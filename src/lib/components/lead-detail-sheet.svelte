<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Card from '$lib/components/ui/card';
	import LeadInfoCard from '$lib/components/lead-info-card.svelte';
	import UtmCard from '$lib/components/utm-card.svelte';
	import { CalendarIcon, LoaderIcon } from '@lucide/svelte';
	import type { Lead } from '$lib/types/leads';
	import type { Conversion } from '$lib/types/conversions';
	import { getConversionsForLead } from '$lib/remote/conversions.remote';
	import { getCustomFieldsForLead } from '$lib/remote/leads.remote';

	interface Props {
		lead: Lead | null;
		open: boolean;
		onOpenChange: (open: boolean) => void;
	}

	let { lead, open, onOpenChange }: Props = $props();

	// Conversions state
	let conversions = $state<Conversion[]>([]);
	let isLoadingConversions = $state(false);
	let conversionsError = $state<string | null>(null);
	let conversionsFetched = $state(false);

	// Custom fields state
	let customFields = $state<Array<{ field_key: string; field_value: string }>>([]);
	let isLoadingCustomFields = $state(false);
	let customFieldsError = $state<string | null>(null);
	let customFieldsFetched = $state(false);

	// Fetch conversions for the current lead
	async function fetchConversions(leadId: string) {
		if (!leadId) {
			conversions = [];
			isLoadingConversions = false;
			return;
		}

		isLoadingConversions = true;
		conversionsError = null;

		try {
			conversions = await getConversionsForLead({ leadId });
		} catch (err) {
			console.error('Error fetching conversions:', err);
			conversionsError = err instanceof Error ? err.message : 'Erro ao carregar conversões';
			conversions = [];
		}

		conversionsFetched = true;
		isLoadingConversions = false;
	}

	// Fetch custom fields for the current lead
	async function fetchCustomFields(leadId: string) {
		if (!leadId) {
			customFields = [];
			isLoadingCustomFields = false;
			return;
		}

		isLoadingCustomFields = true;
		customFieldsError = null;

		try {
			const data = await getCustomFieldsForLead({ leadId });
			customFields = data;
		} catch (err) {
			console.error('Error fetching custom fields:', err);
			customFieldsError =
				err instanceof Error ? err.message : 'Erro ao carregar campos personalizados';
			customFields = [];
		}

		customFieldsFetched = true;
		isLoadingCustomFields = false;
	}

	// Track which tab is active
	let activeTab = $state('general');

	// Fetch data when sheet opens or tabs change
	$effect(() => {
		if (lead?.id && open) {
			// Fetch custom fields immediately when sheet opens (only once)
			if (!customFieldsFetched && !isLoadingCustomFields) {
				fetchCustomFields(lead.id);
			}

			// Only fetch conversions when conversions tab is opened (only once)
			if (activeTab === 'conversions' && !conversionsFetched && !isLoadingConversions) {
				fetchConversions(lead.id);
			}
		} else if (!open) {
			// Clear data when sheet closes
			conversions = [];
			conversionsError = null;
			isLoadingConversions = false;
			conversionsFetched = false; // Reset fetch flag
			customFields = [];
			customFieldsError = null;
			isLoadingCustomFields = false;
			customFieldsFetched = false; // Reset fetch flag
			activeTab = 'general'; // Reset to general tab
		}
	});

	function formatDate(dateString: string | null | undefined): string {
		if (!dateString) return '-';
		try {
			const date = new Date(dateString);
			return date.toLocaleDateString('pt-BR');
		} catch {
			return dateString;
		}
	}

	function formatConversionDate(dateString: string | null): string {
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
</script>

<Sheet.Root {open} {onOpenChange}>
	<Sheet.Content class="w-full gap-0 overflow-auto sm:max-w-md">
		<Sheet.Header class="sticky top-0 z-10 bg-background">
			<Sheet.Title>{lead?.name || 'Lead sem nome'}</Sheet.Title>
			<Sheet.Description>
				Data de criação: {formatDate(lead?.created_at)}
			</Sheet.Description>
		</Sheet.Header>

		<div class="px-4">
			<Tabs.Root value="general" class="w-full">
				<div class="sticky top-[82px] z-10 bg-background pb-1">
					<Tabs.List class="grid w-full grid-cols-2">
						<Tabs.Trigger value="general" onclick={() => (activeTab = 'general')}>
							Visão Geral
						</Tabs.Trigger>
						<Tabs.Trigger value="conversions" onclick={() => (activeTab = 'conversions')}>
							Conversões ({lead?.total_conversions || 0})
						</Tabs.Trigger>
					</Tabs.List>
				</div>

				<div class="pb-4">
					<Tabs.Content value="general" class="space-y-4">
						<!-- Informações Principais -->
						<LeadInfoCard {lead} />

						<!-- Última UTM coletada -->
						<UtmCard
							title="Última UTM coletada"
							utmSource={lead?.last_conversion_utm_source || null}
							utmMedium={lead?.last_conversion_utm_medium || null}
							utmCampaign={lead?.last_conversion_utm_campaign || null}
							utmTerm={lead?.last_conversion_utm_term || null}
							utmContent={lead?.last_conversion_utm_content || null}
						/>

						<!-- Campos Personalizados -->
						<Card.Root class="gap-4">
							<Card.Header>
								<Card.Title class="text-base">Campos personalizados</Card.Title>
							</Card.Header>
							<Card.Content>
								{#if isLoadingCustomFields}
									<div class="py-8 text-center text-muted-foreground">
										<LoaderIcon class="mx-auto mb-4 h-6 w-6 animate-spin" />
										<p class="text-sm">Carregando campos personalizados...</p>
									</div>
								{:else if customFieldsError}
									<div class="py-8 text-center text-destructive">
										<p class="text-sm">{customFieldsError}</p>
									</div>
								{:else if customFields.length > 0}
									<div class="space-y-3">
										{#each customFields as field (field.field_key)}
											<div>
												<span class="text-sm font-medium text-muted-foreground"
													>{field.field_key}</span
												>
												<p class="text-sm">{field.field_value || '-'}</p>
											</div>
										{/each}
									</div>
								{:else}
									<div class="py-8 text-center text-muted-foreground">
										<p class="text-sm">Nenhum campo personalizado encontrado.</p>
									</div>
								{/if}
							</Card.Content>
						</Card.Root>
					</Tabs.Content>

					<Tabs.Content value="conversions" class="space-y-4">
						<Card.Root class="gap-4">
							<Card.Header>
								<Card.Title class="text-base">Conversões</Card.Title>
							</Card.Header>
							<Card.Content>
								{#if isLoadingConversions}
									<div class="py-8 text-center text-muted-foreground">
										<LoaderIcon class="mx-auto mb-4 h-8 w-8 animate-spin" />
										<p>Carregando conversões...</p>
									</div>
								{:else if conversionsError}
									<div class="py-8 text-center text-destructive">
										<p>{conversionsError}</p>
									</div>
								{:else if conversions.length > 0}
									<div class="relative">
										{#each conversions as conversion, index (conversion.id)}
											<div class="relative flex items-start gap-3 pb-4">
												<!-- Vertical line connecting dots -->
												{#if index < conversions.length - 1}
													<div class="absolute top-4 left-1 z-[5] h-full w-px bg-border"></div>
												{/if}
												<div
													class="relative z-[5] mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-foreground"
												></div>
												<div class="min-w-0 flex-1 space-y-2">
													<h4 class="text-sm font-medium">{conversion.name}</h4>
													{#if conversion.value}
														<p class="text-sm font-medium text-green-600">
															R$ {conversion.value.toLocaleString('pt-BR')}
														</p>
													{/if}
													<div class="flex items-center gap-1 text-sm text-muted-foreground">
														<CalendarIcon class="h-3 w-3" />
														<span>{formatConversionDate(conversion.date)}</span>
													</div>
													<div class="space-y-1 text-sm text-muted-foreground">
														<p>Origem: {conversion.utm_source || '-'}</p>
														<p>Média: {conversion.utm_medium || '-'}</p>
														<p>Campanha: {conversion.utm_campaign || '-'}</p>
														<p>Termo: {conversion.utm_term || '-'}</p>
														<p>Conteúdo: {conversion.utm_content || '-'}</p>
														{#if conversion.external_source}
															<p>Origem externa: {conversion.external_source}</p>
														{/if}
													</div>
												</div>
											</div>
										{/each}
									</div>
								{:else}
									<div class="py-8 text-center text-muted-foreground">
										<CalendarIcon class="mx-auto mb-4 h-12 w-12 opacity-50" />
										<p>Nenhuma conversão registrada para este lead.</p>
									</div>
								{/if}
							</Card.Content>
						</Card.Root>
					</Tabs.Content>
				</div>
			</Tabs.Root>
		</div>
	</Sheet.Content>
</Sheet.Root>
