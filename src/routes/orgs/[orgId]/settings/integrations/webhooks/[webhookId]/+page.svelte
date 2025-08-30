<script lang="ts">
	import { page } from '$app/state';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Switch } from '$lib/components/ui/switch';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import {
		ChevronLeftIcon,
		TrashIcon,
		AlertCircleIcon,
		RotateCcwIcon,
		ChevronRightIcon
	} from '@lucide/svelte';
	import type { PageData } from './$types';
	import { Separator } from '$lib/components/ui/separator';
	import { superForm } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';
	import { enhance as sveltekitEnhance } from '$app/forms';
	import * as Form from '$lib/components/ui/form';
	import { updateWebhookFormSchema } from '$lib/schemas/webhook';
	import { AlertError, AlertSuccess, AlertWarning } from '$lib/components/common/alerts';
	import type { ActionResult } from '@sveltejs/kit';
	import Spinner from '$lib/components/spinner.svelte';
	import { PUBLIC_LAIKI_WEBHOOK_URL } from '$env/static/public';
	// import * as Tooltip from '$lib/components/ui/tooltip';
	import Tooltip from '$lib/components/tooltip.svelte';
	import { rotateWebhookSecretKey } from '$lib/remote/webhooks.remote';
	import { invalidateAll } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	// Organization data from parent layout
	const orgData = $derived(page.data);

	// Initialize superForm
	const form = superForm(data.form, {
		id: 'webhook-update-form',
		validators: valibotClient(updateWebhookFormSchema),
		warnings: {
			duplicateId: false
		},
		onUpdated: ({ form }) => {
			if (form.message) {
				toast.success(form.message);
				// Reset form to show updated values from server
				reset({
					data: form.data,
					keepMessage: true
				});
			}
		},
		onError: ({ result }) => {
			if (result.error?.message) {
				toast.error(result.error.message);
			} else {
				toast.error('Erro ao atualizar webhook');
			}
		}
	});

	const { form: formData, errors, enhance, submitting, reset, constraints, delayed } = form;

	let showDeleteDialog = $state(false);
	let isDeleting = $state(false);
	let showRotateKeyDialog = $state(false);
	let isRotatingKey = $state(false);

	// Enhanced form handler for delete action using SvelteKit enhance
	const deleteEnhance = () => {
		isDeleting = true;

		return async ({ result, update }: { result: ActionResult; update: () => Promise<void> }) => {
			if (result.type === 'error') {
				toast.error('Erro ao excluir webhook');
			} else {
				await update();
			}

			isDeleting = false;
			showDeleteDialog = false;
		};
	};

	// Handle rotating secret key using remote function
	async function handleRotateSecretKey() {
		isRotatingKey = true;

		try {
			await rotateWebhookSecretKey({
				webhookId: page.params.webhookId as string,
				organizationId: page.params.orgId as string
			});

			toast.success('Chave secreta rotacionada com sucesso');
			await invalidateAll(); // Refresh page data to show new key
		} catch (err) {
			console.error('Error rotating secret key:', err);
			toast.error('Erro ao rotacionar chave secreta');
		} finally {
			isRotatingKey = false;
			showRotateKeyDialog = false;
		}
	}
</script>

<svelte:head>
	<title>
		Editar {data.webhook.name} | {orgData.currentOrganization?.name || 'Organização'} | Laiki
	</title>
</svelte:head>

<div class="mx-auto w-full max-w-4xl space-y-6 p-6">
	<!-- Page Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center space-x-4">
			<Button
				href={`/orgs/${page.params.orgId}/settings/integrations/webhooks`}
				variant="ghost"
				size="sm"
				class="h-8 w-8 p-0"
			>
				<ChevronLeftIcon class="h-4 w-4" />
			</Button>
			<div>
				<div class="flex items-center gap-3">
					<h1 class="text-2xl font-semibold tracking-tight">Editar webhook</h1>
					<Badge variant={data.webhook.is_active ? 'default' : 'secondary'}>
						{data.webhook.is_active ? 'Ativo' : 'Inativo'}
					</Badge>
				</div>
				<p class="text-muted-foreground">Modifique as configurações do webhook</p>
			</div>
		</div>
	</div>

	<!-- Main Form -->
	<div class="grid gap-4">
		<div>
			{#if data.webhook.is_active}
				<AlertSuccess message="Webhook está ativo e recebendo eventos." />
			{:else}
				<AlertWarning message="Webhook está inativo e não está recebendo eventos." />
			{/if}
		</div>
		<!-- Basic Information -->
		<Card.Root>
			<Card.Header>
				{#if $errors._errors}
					<div class="mb-4">
						<AlertError errors={$errors._errors} />
					</div>
				{/if}

				<Card.Title class="flex items-center gap-2">Informações básicas</Card.Title>
			</Card.Header>
			<Card.Content>
				<form id="basic-information-form" method="POST" action="?/update" use:enhance>
					<div class="space-y-6">
						<Form.Field {form} name="isActive">
							<Form.Control>
								{#snippet children({ props })}
									<div class="flex items-center space-x-2">
										<Switch
											{...props}
											{...$constraints.isActive}
											bind:checked={$formData.isActive}
										/>
										<Form.Label>
											Webhook {$formData.isActive ? 'ativo' : 'inativo'}
										</Form.Label>
									</div>
								{/snippet}
							</Form.Control>
						</Form.Field>

						<Form.Field {form} name="name">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Nome</Form.Label>
									<Input
										{...props}
										{...$constraints.name}
										type="text"
										placeholder="Ex: CRM Integration"
										bind:value={$formData.name}
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<Form.Field {form} name="description">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Descrição (opcional)</Form.Label>
									<Textarea
										{...props}
										{...$constraints.description}
										placeholder="Descreva o propósito deste webhook..."
										bind:value={$formData.description}
										rows={3}
									/>
								{/snippet}
							</Form.Control>
							<Form.Description>
								Descrição opcional para identificar a finalidade do webhook
							</Form.Description>
							<Form.FieldErrors />
						</Form.Field>
					</div>
				</form>

				<div class="space-y-2">
					<p class="text-sm font-medium">Endpoint</p>
					<div class="w-full">
						<Tooltip content="Copiar o endpoint para a área de transferência">
							<button
								onclick={() => {
									navigator.clipboard.writeText(
										`${PUBLIC_LAIKI_WEBHOOK_URL}/webhooks/${page.params.orgId}/${page.params.webhookId}?key=${data.webhook.secret_key}`
									);
									toast.success('Endpoint copiado para a área de transferência');
								}}
								class="cursor-copy rounded-md border bg-input/50 px-3 py-2 font-mono text-sm break-all text-muted-foreground transition-colors hover:bg-input/70"
							>
								{PUBLIC_LAIKI_WEBHOOK_URL}/webhooks/${page.params.orgId}/${page.params
									.webhookId}?key={data.webhook.secret_key}
							</button>
						</Tooltip>
					</div>
					<p class="text-sm text-muted-foreground">
						O endpoint é gerado automaticamente e não pode ser alterado.
					</p>
				</div>

				<Separator class="my-6" />

				<div class="space-y-2">
					<Button
						type="button"
						variant="outline"
						onclick={() => {
							showRotateKeyDialog = true;
						}}
					>
						<RotateCcwIcon class="mr-2 h-4 w-4" />
						Rotacionar chave secreta
					</Button>
					<p class="text-sm text-muted-foreground">
						A chave secreta é usada para autenticar as requisições para este webhook.<br /> Não esqueça
						de atualizar o endpoint com a nova chave secreta.
					</p>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				{#if !data.webhook.field_mappings || Object.keys(data.webhook.field_mappings).length === 0}
					<div class="mb-4">
						<AlertWarning>
							Webhook sem campos mapeados. É necessário configurar os mapeamentos de campos para
							importar dados.
						</AlertWarning>
					</div>
				{/if}

				<Card.Title class="flex items-center gap-2">Mapeamentos de campos</Card.Title>
				<Card.Description>
					Configure o mapeamento de campos para importação de dados.
				</Card.Description>
			</Card.Header>

			<Card.Content class="space-y-4">
				<Button
					variant="outline"
					href={`/orgs/${page.params.orgId}/settings/integrations/webhooks/${page.params.webhookId}/mapping`}
				>
					Configurar mapeamentos
					<ChevronRightIcon class="h-4 w-4" />
				</Button>
			</Card.Content>
		</Card.Root>

		<!-- Actions -->
		<div
			class="sticky bottom-0 flex items-center justify-end space-x-2 bg-background/80 py-2 backdrop-blur-sm"
		>
			<Button
				type="button"
				href={`/orgs/${page.params.orgId}/settings/integrations/webhooks`}
				variant="outline"
			>
				Cancelar
			</Button>
			<Form.Button form="basic-information-form" disabled={$submitting}>
				{#if $delayed}
					<Spinner class="mr-2" />
				{/if}
				{$submitting ? 'Salvando...' : 'Salvar alterações'}
			</Form.Button>
		</div>
	</div>

	<Card.Root class="border-destructive/50 bg-destructive/5">
		<Card.Header>
			<Card.Title class="flex items-center gap-2 text-destructive/80">
				<AlertCircleIcon class="h-5 w-5 text-destructive/80" />
				Área de risco
			</Card.Title>
			<Card.Description class="text-muted-foreground">
				Esta ação não pode ser desfeita. Todos os eventos enviados para este webhook serão
				interrompidos.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<Button
				variant="destructive"
				onclick={() => {
					showDeleteDialog = true;
				}}
			>
				<TrashIcon class="mr-2 h-4 w-4" />
				Excluir webhook
			</Button>
		</Card.Content>
	</Card.Root>
</div>

<!-- Delete Confirmation Dialog -->
<AlertDialog.Root bind:open={showDeleteDialog}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Excluir webhook</AlertDialog.Title>
			<AlertDialog.Description>
				Tem certeza de que deseja excluir o webhook "{data.webhook.name}"? Esta ação não pode ser
				desfeita e todos os dados associados serão perdidos.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => (showDeleteDialog = false)} disabled={isDeleting}>
				Cancelar
			</AlertDialog.Cancel>
			<form method="POST" action="?/delete" use:sveltekitEnhance={deleteEnhance}>
				<AlertDialog.Action
					type="submit"
					class={buttonVariants({ variant: 'destructive' })}
					disabled={isDeleting}
				>
					{#if isDeleting}
						<Spinner class="mr-2" />
						Excluindo...
					{:else}
						<TrashIcon class="mr-2 h-4 w-4" />
						Excluir
					{/if}
				</AlertDialog.Action>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<!-- Rotate Secret Key Confirmation Dialog -->
<AlertDialog.Root bind:open={showRotateKeyDialog}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Rotacionar chave secreta</AlertDialog.Title>
			<AlertDialog.Description>
				Tem certeza de que deseja rotacionar a chave secreta do webhook "{data.webhook.name}"? A
				chave atual será substituída por uma nova e você precisará atualizar todos os sistemas que
				utilizam este webhook.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => (showRotateKeyDialog = false)} disabled={isRotatingKey}>
				Cancelar
			</AlertDialog.Cancel>
			<AlertDialog.Action type="button" disabled={isRotatingKey} onclick={handleRotateSecretKey}>
				{#if isRotatingKey}
					<Spinner class="mr-2" />
					Rotacionando...
				{:else}
					Rotacionar chave
				{/if}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
