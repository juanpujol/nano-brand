<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Card from '$lib/components/ui/card';
	import { ChevronLeft, Search, Plus } from '@lucide/svelte';
	import type { PageData } from './$types';
	import { Badge } from '$lib/components/ui/badge';
	import { parseTargetFieldKey, flattenGroupedMappings } from './utils/field-mapping';
	import { processTargetFieldSections, isEmptySearchResult } from './utils/target-field-processor';
	import { validateMappings } from './utils/validation';
	import { flattenWebhookPayload } from './utils/transformers';
	import type { TargetFieldMappings, CustomFieldDefinition } from './types';
	import CustomFieldDialog from '$lib/components/custom-field-dialog.svelte';
	import WebhookFieldSelectionDialog from './components/webhook-field-selection-dialog.svelte';
	import WebhookFieldRow from './components/webhook-field-row.svelte';
	import WebhookPayloadDialog from './components/webhook-payload-dialog.svelte';
	import EmptyState from './components/empty-state.svelte';
	import { updateWebhookMappings, updateCaptureNext } from '$lib/remote/webhooks.remote';
	import type { UpdateMappingsParams } from '$lib/schemas/webhook';
	import { Switch } from '$lib/components/ui/switch';
	import Label from '$lib/components/ui/label/label.svelte';
	import { invalidateAll } from '$app/navigation';
	import AlertWarning from '$lib/components/common/alerts/alert-warning.svelte';
	import Spinner from '$lib/components/spinner.svelte';

	let { data }: { data: PageData } = $props();

	// Organization data from parent layout
	const orgData = $derived(page.data);

	// Get data from server load
	const webhook = $derived(data.webhook);
	const customFieldsDefinitions = $derived(data.customFields || ([] as CustomFieldDefinition[]));

	// Flatten the webhook sample payload
	const flatPayload = $derived(
		webhook.sample_payload ? flattenWebhookPayload(webhook.sample_payload) : {}
	);

	// Search state
	let searchTerm = $state('');

	// Target field mappings state: targetField -> webhookField
	// Initialize from saved field mappings - use writable derived pattern as suggested by linter
	const initialMappings = $derived(flattenGroupedMappings(webhook.field_mappings));
	let targetMappings = $state<TargetFieldMappings>({});

	// Initialize targetMappings only once when component mounts
	$effect(() => {
		if (Object.keys(targetMappings).length === 0 && Object.keys(initialMappings).length > 0) {
			targetMappings = { ...initialMappings };
		}
	});

	// Create custom field dialog state
	let isCreateDialogOpen = $state(false);

	// Field selection dialog state
	let activeDialogTarget = $state<string | null>(null);

	// Payload dialog state
	let isPayloadDialogOpen = $state(false);

	// Validation state
	const validation = $derived(validateMappings(targetMappings));

	// Loading state for save operation
	let isSaving = $state(false);

	// Capture next payload state
	let isUpdatingCaptureNext = $state(false);

	// Get all target fields organized by type (filtered by search)
	const targetFieldSections = $derived(
		processTargetFieldSections(customFieldsDefinitions, searchTerm)
	);

	// Handle opening create custom field dialog
	function openCreateDialog() {
		isCreateDialogOpen = true;
	}

	// Handle toggling capture next payload
	async function handleCaptureNextToggle(value: boolean) {
		isUpdatingCaptureNext = true;

		try {
			await updateCaptureNext({
				webhookId: page.params.webhookId as string,
				organizationId: page.params.orgId as string,
				captureNext: value
			});

			// Update local webhook data
			data.webhook.capture_next = value;
			await invalidateAll();
		} catch (error) {
			console.error('Error updating capture next:', error);
			// Revert the switch state on error
			data.webhook.capture_next = !value;
		} finally {
			isUpdatingCaptureNext = false;
		}
	}

	// Handle opening payload dialog
	function openPayloadDialog() {
		isPayloadDialogOpen = true;
	}

	// Handle payload save
	async function handlePayloadSave(newPayload: unknown) {
		try {
			// Update webhook with new sample payload using remote function
			await updateWebhookMappings({
				webhookId: page.params.webhookId as string,
				organizationId: page.params.orgId as string,
				mappings: targetMappings,
				samplePayload: newPayload
			});

			// Update local data
			data.webhook.sample_payload = newPayload;
		} catch (error) {
			console.error('Error saving payload:', error);
			throw new Error('Falha ao salvar payload');
		}
	}

	// Handle saving mappings
	async function handleSaveMappings() {
		if (!validation.isValid) return;

		isSaving = true;

		try {
			// Transform targetMappings into grouped format expected by the backend
			const groupedMappings = {
				leads: {} as Record<string, string>,
				conversions: {} as Record<string, string>,
				custom_fields: {} as Record<string, string>
			};

			// Group mappings by type
			for (const [targetKey, webhookField] of Object.entries(targetMappings)) {
				if (!webhookField) continue;

				const { type, fieldKey } = parseTargetFieldKey(targetKey);

				switch (type) {
					case 'lead':
						groupedMappings.leads[fieldKey] = webhookField;
						break;
					case 'conversion':
						groupedMappings.conversions[fieldKey] = webhookField;
						break;
					case 'custom_field':
						groupedMappings.custom_fields[fieldKey] = webhookField;
						break;
				}
			}

			const updateData: UpdateMappingsParams = {
				webhookId: page.params.webhookId as string,
				organizationId: page.params.orgId as string,
				mappings: groupedMappings,
				samplePayload: webhook.sample_payload
			};

			await updateWebhookMappings(updateData);
			await invalidateAll();
		} catch (error) {
			console.error('Error saving mappings:', error);
			// Could add error toast here
			throw error;
		} finally {
			isSaving = false;
		}
	}

	// Handle opening field selection dialog
	function openFieldDialog(targetKey: string) {
		activeDialogTarget = targetKey;
	}

	// Handle closing field selection dialog
	function closeFieldDialog() {
		const previousTarget = activeDialogTarget;
		activeDialogTarget = null;

		// Focus back on the button that triggered the dialog
		if (previousTarget) {
			setTimeout(() => {
				const button = document.getElementById(previousTarget);
				button?.focus();
			}, 100);
		}
	}

	// Handle selecting a webhook field
	function selectWebhookField(webhookField: string) {
		if (activeDialogTarget) {
			if (webhookField === '') {
				delete targetMappings[activeDialogTarget];
			} else {
				targetMappings[activeDialogTarget] = webhookField;
			}
		}
		closeFieldDialog();
	}
</script>

{#snippet targetSection(
	title: string,
	fields: Array<{ key: string; label: string; isRequired: boolean }>
)}
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-lg">{title}</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="overflow-clip rounded-xl border bg-background dark:bg-background/50">
				{#each fields as field (field.key)}
					<WebhookFieldRow
						targetKey={field.key}
						label={field.label}
						isRequired={field.isRequired}
						selectedValue={targetMappings[field.key]}
						onOpenFieldDialog={openFieldDialog}
					/>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>
{/snippet}

<svelte:head>
	<title>
		Mapeamento de campos | {data.webhook.name} | {orgData.currentOrganization?.name ||
			'Organização'} | Laiki
	</title>
</svelte:head>

<div class="mx-auto w-full max-w-4xl space-y-6 p-6">
	<!-- Page Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center space-x-4">
			<Button
				href={`/orgs/${page.params.orgId}/settings/integrations/webhooks/${page.params.webhookId}`}
				variant="ghost"
				size="sm"
				class="h-8 w-8 p-0"
			>
				<ChevronLeft class="h-4 w-4" />
			</Button>
			<div>
				<div class="flex items-center gap-3">
					<h1 class="text-2xl font-semibold tracking-tight">Mapeamento de campos</h1>
				</div>
				<p class="text-muted-foreground">
					Webhook: {data.webhook.name}
				</p>
			</div>
		</div>
	</div>

	<!-- Sample Payload -->
	<Card.Root>
		<Card.Header>
			<div class="mb-4">
				{#if !webhook.sample_payload}
					<AlertWarning>
						O webhook não possui um payload de exemplo. É necessário capturar um payload para mapear
						os campos.
					</AlertWarning>
				{/if}
			</div>

			<Card.Title class="text-lg">Payload do webhook</Card.Title>
			<Card.Description>
				O objeto JSON recebido quando o webhook é acionado. É requerido ter um exemplo de payload
				para mapear corretamente os campos.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div class="flex gap-4">
					<Switch
						id="captura-automatica-payload"
						class="mt-1"
						checked={webhook.capture_next}
						disabled={isUpdatingCaptureNext}
						onCheckedChange={handleCaptureNextToggle}
					/>
					<div class="flex flex-col">
						<Label for="captura-automatica-payload" class="text-sm">
							Captura automática de payload
						</Label>
						<p class="text-xs text-muted-foreground">
							Se ativado, o payload será capturado automaticamente quando o webhook for acionado.
						</p>
					</div>
				</div>
				<div>
					<Button variant="outline" size="sm" onclick={openPayloadDialog}>Alterar payload</Button>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Check for empty state: no payload AND no existing mappings -->
	{#if !webhook.sample_payload && (!webhook.field_mappings || Object.keys(flattenGroupedMappings(webhook.field_mappings)).length === 0)}
		<EmptyState onOpenPayloadDialog={openPayloadDialog} />
	{:else}
		<!-- Search and Validation Status -->
		<Card.Root>
			<Card.Content>
				<div class="space-y-4">
					<div class="relative">
						<Search
							class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							type="text"
							placeholder="Buscar campos do webhook..."
							bind:value={searchTerm}
							class="w-full pl-9"
						/>
					</div>

					{#if !validation.isValid}
						<div class="flex flex-col gap-2">
							<Badge
								variant="outline"
								class="border-red-400 bg-red-50 text-red-800 dark:border-red-900/80 dark:bg-red-900/30 dark:text-red-300"
							>
								{validation.missingFields.length} campos obrigatórios pendentes
							</Badge>
							<span class="text-sm text-muted-foreground">
								{validation.missingFields.join(', ')}
							</span>
						</div>
					{:else}
						<Badge
							variant="default"
							class="border-green-400 bg-green-50 text-green-800 dark:border-green-900/80 dark:bg-green-900/30 dark:text-green-400"
						>
							Todos os campos obrigatórios mapeados
						</Badge>
					{/if}
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Target Sections -->
		<div class="space-y-6">
			{#if searchTerm.trim() && isEmptySearchResult(targetFieldSections)}
				<!-- Empty search state -->
				<Card.Root>
					<Card.Content class="flex flex-col items-center justify-center px-4 py-12 text-center">
						<div class="mb-4 rounded-full bg-muted p-4">
							<Search class="h-8 w-8 text-muted-foreground" />
						</div>
						<h3 class="mb-2 text-lg font-medium">Nenhum campo encontrado</h3>
						<p class="max-w-sm text-muted-foreground">
							Não encontramos campos que correspondam a "{searchTerm}". Tente ajustar os termos de
							busca.
						</p>
					</Card.Content>
				</Card.Root>
			{:else}
				<!-- Lead Fields -->
				{#if targetFieldSections.lead.length > 0}
					{@render targetSection('Campos de lead', targetFieldSections.lead)}
				{/if}

				<!-- Conversion Fields -->
				{#if targetFieldSections.conversion.length > 0}
					{@render targetSection('Campos de conversão', targetFieldSections.conversion)}
				{/if}

				<!-- Custom Fields -->
				{#if !searchTerm.trim() || targetFieldSections.custom.length > 0}
					<Card.Root>
						<Card.Header>
							<div class="flex items-center justify-between">
								<Card.Title class="text-lg">Campos personalizados</Card.Title>
								{#if !searchTerm.trim()}
									<Button variant="outline" size="sm" onclick={openCreateDialog}>
										<Plus class="h-4 w-4" />
										Adicionar campo
									</Button>
								{/if}
							</div>
						</Card.Header>
						<Card.Content class="space-y-4">
							{#if targetFieldSections.custom.length === 0}
								<p class="py-8 text-center text-muted-foreground">
									{#if searchTerm.trim()}
										Nenhum campo personalizado corresponde a "{searchTerm}".
									{:else}
										Nenhum campo personalizado criado. Clique em "Adicionar campo" para criar um.
									{/if}
								</p>
							{:else}
								<div class="overflow-clip rounded-xl border bg-background dark:bg-background/50">
									{#each targetFieldSections.custom as field (field.key)}
										<WebhookFieldRow
											targetKey={field.key}
											label={field.label}
											isRequired={field.isRequired}
											selectedValue={targetMappings[field.key]}
											onOpenFieldDialog={openFieldDialog}
										/>
									{/each}
								</div>
							{/if}
						</Card.Content>
					</Card.Root>
				{/if}
			{/if}
		</div>
	{/if}
	<!-- Actions -->
	<div
		class="sticky bottom-0 flex items-center justify-end space-x-2 bg-background/80 py-2 backdrop-blur-sm"
	>
		<Button
			type="button"
			href={`/orgs/${page.params.orgId}/settings/integrations/webhooks/${page.params.webhookId}`}
			variant="outline"
		>
			Cancelar
		</Button>

		<Button
			disabled={!validation.isValid || isSaving}
			onclick={() => handleSaveMappings().catch(console.error)}
		>
			{#if isSaving}
				<div class="flex items-center gap-2">
					<Spinner class="mr-2" />
					Salvando...
				</div>
			{:else}
				Salvar alterações
			{/if}
		</Button>
	</div>
</div>

<!-- Create Custom Field Dialog -->
<CustomFieldDialog
	bind:open={isCreateDialogOpen}
	mode="create"
	customField={null}
	organizationId={orgData.currentOrganization?.id}
/>

<!-- Webhook Field Selection Dialog -->
<WebhookFieldSelectionDialog
	open={activeDialogTarget !== null}
	targetField={activeDialogTarget}
	webhookFields={flatPayload}
	selectedValue={activeDialogTarget ? targetMappings[activeDialogTarget] : undefined}
	onSelect={selectWebhookField}
	onClose={closeFieldDialog}
/>

<!-- Webhook Payload Dialog -->
<WebhookPayloadDialog
	bind:open={isPayloadDialogOpen}
	currentPayload={data.webhook.sample_payload}
	onSave={handlePayloadSave}
/>
