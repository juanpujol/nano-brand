<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import { Save, Plus, Type, Key, Users, SquarePen, Trash2 } from '@lucide/svelte';
	import type {
		LeadsCustomFieldDefinition,
		UpdateCustomFieldParams
	} from '$lib/schemas/custom-fields';
	import CustomFieldLeadsSheet from './custom-field-leads-sheet.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { buttonVariants } from '$lib/components/ui/button';
	import { AlertWarning } from '$lib/components/common/alerts';
	import {
		createCustomFieldDefinition,
		updateCustomFieldDefinition,
		deleteCustomFieldDefinition
	} from '$lib/remote/custom-fields.remote';
	import { invalidateAll } from '$app/navigation';
	import { parseRemoteValidationErrors } from '$lib/utils/validation-errors';

	interface Props {
		open: boolean;
		mode: 'create' | 'update';
		customField: LeadsCustomFieldDefinition | null;
		organizationId: string; // Required for create mode, can be passed for update mode too
	}

	let { open = $bindable(), mode, customField, organizationId }: Props = $props();

	// Use organizationId prop for create mode, customField.organization_id for update mode
	const effectiveOrgId = $derived(
		mode === 'create' ? organizationId : customField?.organization_id || organizationId
	);

	// Simple form values
	let label = $state('');
	let fieldKey = $state('');
	let description = $state('');
	let type = $state('text');
	let isRequired = $state(false);

	let isLoading = $state(false);

	// Field errors
	let fieldErrors = $state<Record<string, string>>({});

	// Sheet state for update mode
	let isLeadsSheetOpen = $state(false);

	// Delete dialog state
	let showDeleteDialog = $state(false);
	let isDeleting = $state(false);

	function openLeadsSheet() {
		isLeadsSheetOpen = true;
	}

	function closeLeadsSheet() {
		isLeadsSheetOpen = false;
	}

	async function handleDelete() {
		if (!customField) return;

		isDeleting = true;

		try {
			await deleteCustomFieldDefinition({
				fieldId: customField.id,
				organizationId: customField.organization_id
			});

			await invalidateAll();
			showDeleteDialog = false;
			open = false;
		} catch (error) {
			console.error('Error deleting custom field:', error);
			throw error;
		} finally {
			isDeleting = false;
		}
	}

	// Auto-generate fieldKey from label (create mode only)
	$effect(() => {
		if (mode === 'create' && label) {
			// Convert label to snake_case fieldKey
			const key = label
				.toLowerCase()
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '') // Remove accents
				.replace(/[^a-z0-9\s_-]/g, '') // Remove special characters except spaces, underscores, and dashes
				.replace(/[\s_-]+/g, '_') // Replace spaces, underscores, and dashes with single underscore
				.replace(/_{2,}/g, '_') // Replace multiple underscores with single
				.replace(/^_|_$/g, ''); // Remove leading/trailing underscores

			fieldKey = key;
		} else if (mode === 'create' && !label) {
			fieldKey = '';
		}
	});

	// Reset form when dialog opens/closes or mode changes
	$effect(() => {
		if (!open) {
			// Reset to default state
			label = '';
			fieldKey = '';
			description = '';
			type = 'text';
			isRequired = false;
			fieldErrors = {};
		} else if (open && mode === 'update' && customField) {
			// Populate with existing field data
			label = customField.label || '';
			fieldKey = customField.field_key || '';
			description = customField.description || '';
			type = customField.type || 'text';
			isRequired = customField.is_required || false;
			fieldErrors = {};
		} else if (open && mode === 'create') {
			// Reset to empty for create mode
			label = '';
			fieldKey = '';
			description = '';
			type = 'text';
			isRequired = false;
			fieldErrors = {};
		}
	});

	async function handleSubmit() {
		isLoading = true;
		fieldErrors = {}; // Clear previous errors

		try {
			if (mode === 'create') {
				const createData = {
					organizationId: effectiveOrgId,
					label: label.trim(),
					fieldKey: fieldKey.trim(),
					description: description.trim() || '',
					type,
					isRequired
				};

				await createCustomFieldDefinition(createData);
			} else if (customField) {
				const updateData: UpdateCustomFieldParams = {
					fieldId: customField.id,
					organizationId: effectiveOrgId,
					label: label.trim(),
					isRequired
				};

				// Only include description if it has a value
				const trimmedDescription = description?.trim();
				if (trimmedDescription) {
					updateData.description = trimmedDescription;
				}

				await updateCustomFieldDefinition(updateData);
			}

			await invalidateAll();
			open = false;
		} catch (error) {
			console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} custom field:`, error);

			// Parse validation errors and set field errors
			const parsedErrors = parseRemoteValidationErrors(error);
			if (Object.keys(parsedErrors).length > 0) {
				fieldErrors = parsedErrors;
			} else {
				// If it's not a validation error, rethrow it
				throw error;
			}
		} finally {
			isLoading = false;
		}
	}

	function handleCancel() {
		open = false;
	}

	// Reactive values based on mode
	const dialogTitle = $derived(
		mode === 'create' ? 'Criar campo personalizado' : 'Editar campo personalizado'
	);
	const dialogDescription = $derived(
		mode === 'create'
			? 'Crie um novo campo personalizado que será aplicado aos leads da organização.'
			: 'Atualize as informações do campo personalizado. A chave e o tipo não podem ser alterados.'
	);
	const submitButtonText = $derived(mode === 'create' ? 'Criar campo' : 'Salvar alterações');
	const loadingText = $derived(mode === 'create' ? 'Criando...' : 'Salvando...');
	const isFieldEditable = $derived(mode === 'create');
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-h-[90vh] w-[90vw] max-w-sm overflow-y-auto sm:w-full sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				{#if mode === 'create'}
					<Plus class="h-5 w-5" />
				{:else}
					<SquarePen class="h-5 w-5" />
				{/if}
				{dialogTitle}
			</Dialog.Title>
			<Dialog.Description>
				{dialogDescription}
			</Dialog.Description>

			<!-- Action buttons (update mode only) -->
			{#if mode === 'update' && customField}
				<div class="flex items-center justify-between gap-2 pt-2">
					<Button
						variant="outline"
						size="sm"
						onclick={openLeadsSheet}
						class="flex items-center gap-2"
					>
						<Users class="h-4 w-4" />
						Ver leads ({customField.usage_count || 0})
					</Button>

					<Button
						variant="outline"
						size="sm"
						onclick={() => (showDeleteDialog = true)}
						class="flex items-center gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
					>
						<Trash2 class="h-4 w-4" />
						Excluir
					</Button>
				</div>
			{/if}
		</Dialog.Header>

		{#if mode === 'create' || customField}
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit().catch((error) => {
						console.error('Form submission error:', error);
					});
				}}
				class="space-y-4"
			>
				<!-- Editable fields -->
				<div class="space-y-4">
					<!-- Title Field -->
					<div class="space-y-2">
						<Label for="field-label" class="text-sm font-medium">Título *</Label>
						<Input
							id="field-label"
							bind:value={label}
							placeholder="Digite o título do campo"
							required
							disabled={isLoading}
							class={fieldErrors.label ? 'border-destructive' : ''}
						/>
						{#if fieldErrors.label}
							<p class="text-xs text-destructive">{fieldErrors.label}</p>
						{:else}
							<p class="text-xs text-muted-foreground">
								Nome amigável que será exibido nos formulários
							</p>
						{/if}
					</div>

					<!-- Description Field -->
					<div class="space-y-2">
						<Label for="field-description" class="text-sm font-medium">Descrição</Label>
						<Textarea
							id="field-description"
							bind:value={description}
							placeholder="Descreva o propósito deste campo (opcional)"
							disabled={isLoading}
							rows={2}
							class="min-h-[60px] sm:min-h-[80px]"
						/>
						{#if fieldErrors.description}
							<p class="text-xs text-destructive">{fieldErrors.description}</p>
						{:else}
							<p class="text-xs text-muted-foreground">
								Descrição opcional para ajudar os usuários a entender o campo
							</p>
						{/if}
					</div>

					<!-- Key and Type fields -->
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<!-- Field Key -->
						<div class="space-y-2">
							<Label
								for="field-key"
								class="text-sm font-medium {!isFieldEditable ? 'text-muted-foreground' : ''}"
							>
								<Key class="mr-1 inline h-4 w-4" />
								Chave
							</Label>
							{#if isFieldEditable}
								<Input
									id="field-key"
									bind:value={fieldKey}
									placeholder="campo_personalizado"
									disabled={isLoading}
									class={`font-mono text-sm ${fieldErrors.fieldKey ? 'border-destructive' : ''}`}
								/>
								{#if fieldErrors.fieldKey}
									<p class="text-xs text-destructive">{fieldErrors.fieldKey}</p>
								{:else}
									<p class="text-xs text-muted-foreground">
										Identificador único gerado automaticamente (editável)
									</p>
								{/if}
							{:else}
								<Input
									id="field-key"
									value={fieldKey}
									disabled
									class="bg-muted text-muted-foreground"
								/>
								<p class="text-xs text-muted-foreground">Não editável</p>
							{/if}
						</div>

						<!-- Field Type -->
						<div class="space-y-2">
							<Label
								for="field-type"
								class="text-sm font-medium {!isFieldEditable ? 'text-muted-foreground' : ''}"
							>
								<Type class="mr-1 inline h-4 w-4" />
								Tipo
							</Label>
							{#if isFieldEditable}
								<Select.Root
									type="single"
									value={type}
									onValueChange={(value: string) => {
										type = value || 'text';
									}}
									disabled={isLoading}
								>
									<Select.Trigger class="w-full">
										<span class="block truncate">
											{type === 'text'
												? 'Texto'
												: type === 'number'
													? 'Número'
													: type === 'date'
														? 'Data'
														: type === 'boolean'
															? 'Verdadeiro/Falso'
															: 'Selecione um tipo'}
										</span>
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="text" label="Texto">Texto</Select.Item>
										<Select.Item value="number" label="Número">Número</Select.Item>
										<Select.Item value="date" label="Data">Data</Select.Item>
										<Select.Item value="boolean" label="Verdadeiro/Falso"
											>Verdadeiro/Falso</Select.Item
										>
									</Select.Content>
								</Select.Root>
								{#if fieldErrors.type}
									<p class="text-xs text-destructive">{fieldErrors.type}</p>
								{:else}
									<p class="text-xs text-muted-foreground">
										Tipo de dados que será armazenado neste campo
									</p>
								{/if}
							{:else}
								<Input
									id="field-type"
									value={type}
									disabled
									class="bg-muted text-muted-foreground"
								/>
								<p class="text-xs text-muted-foreground">Não editável</p>
							{/if}
						</div>
					</div>

					<!-- Is Required Switch -->
					<div class="flex items-center justify-between">
						<div class="space-y-0.5">
							<Label for="field-required" class="text-sm font-medium">Campo obrigatório</Label>
							<p class="text-xs text-muted-foreground">
								Define se este campo deve ser preenchido obrigatoriamente
							</p>
						</div>
						<Switch id="field-required" bind:checked={isRequired} disabled={isLoading} />
					</div>
				</div>

				<!-- Usage Info (update mode only) -->
				{#if mode === 'update' && customField && customField.usage_count > 0}
					<div class="rounded-lg bg-muted p-3">
						<p class="text-sm text-muted-foreground">
							<strong>Em uso:</strong> Este campo está sendo usado por {customField.usage_count}
							lead{customField.usage_count !== 1 ? 's' : ''}.
						</p>
					</div>
				{/if}

				<!-- Action Buttons -->
				<div class="flex gap-3 pt-4">
					<Button
						type="button"
						variant="outline"
						onclick={handleCancel}
						class="flex-1"
						disabled={isLoading}
					>
						Cancelar
					</Button>
					<Button type="submit" class="flex-1" disabled={isLoading}>
						{#if isLoading}
							<div class="flex items-center gap-2">
								<div
									class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
								></div>
								{loadingText}
							</div>
						{:else}
							<Save class="mr-2 h-4 w-4" />
							{submitButtonText}
						{/if}
					</Button>
				</div>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<!-- Custom Field Leads Sheet (update mode only) -->
{#if mode === 'update'}
	<CustomFieldLeadsSheet {customField} open={isLeadsSheetOpen} onOpenChange={closeLeadsSheet} />
{/if}

<!-- Delete Confirmation Dialog -->
<AlertDialog.Root bind:open={showDeleteDialog}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Excluir campo personalizado</AlertDialog.Title>
			<AlertDialog.Description>
				{#if customField}
					Tem certeza de que deseja excluir o campo "<strong>{customField.label}</strong>"?
					{#if customField.usage_count > 0}
						<div class="my-4">
							<AlertWarning>
								Atenção: Este campo está sendo usado por <strong>{customField.usage_count}</strong>
								lead{customField.usage_count !== 1 ? 's' : ''}. Ao excluí-lo, os dados deste campo
								serão perdidos permanentemente.
							</AlertWarning>
						</div>
					{/if}
					Esta ação não pode ser desfeita.
				{/if}
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
					<div class="flex items-center gap-2">
						<div
							class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
						></div>
						Excluindo...
					</div>
				{:else}
					<Trash2 class="mr-2 h-4 w-4" />
					Excluir campo
				{/if}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
