<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { PlusIcon } from '@lucide/svelte';
	import Spinner from '$lib/components/spinner.svelte';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';
	import * as Form from '$lib/components/ui/form';
	import { createWebhookFormSchema } from '$lib/schemas/webhooks';
	import { type InferInput } from 'valibot';

	interface Props {
		open: boolean;
		createForm: SuperValidated<InferInput<typeof createWebhookFormSchema>>;
		formAction: string;
	}

	let { open = $bindable(), createForm, formAction }: Props = $props();

	// Initialize superForm
	const form = superForm(createForm, {
		id: 'create-webhook',
		validators: valibotClient(createWebhookFormSchema),
		resetForm: true,
		onError: ({ result }) => {
			if (result.error?.message) {
				toast.error(result.error.message);
			} else {
				toast.error('Erro ao criar webhook');
			}
		}
	});

	const { form: formData, errors, enhance, submitting, constraints } = form;

	function handleCancel() {
		open = false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-h-[90vh] w-[90vw] max-w-sm overflow-y-auto sm:w-full sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<PlusIcon class="h-5 w-5" />
				Novo Webhook
			</Dialog.Title>
			<Dialog.Description>
				Crie um novo webhook para receber notificações automáticas de eventos da sua organização.
			</Dialog.Description>
		</Dialog.Header>

		{#if $errors._errors}
			<div class="mb-4">
				<div
					class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
				>
					{#each $errors._errors as error, index (index)}
						<p>{error}</p>
					{/each}
				</div>
			</div>
		{/if}

		<form method="POST" action={formAction} use:enhance class="space-y-4">
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
							disabled={$submitting}
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
							placeholder="Descreva o propósito deste webhook (opcional)"
							bind:value={$formData.description}
							disabled={$submitting}
							rows={3}
							class="min-h-[80px]"
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
				<Form.Description>
					Descrição opcional para identificar a finalidade do webhook
				</Form.Description>
			</Form.Field>

			<!-- Action Buttons -->
			<div class="flex gap-3 pt-4">
				<Button
					type="button"
					variant="outline"
					onclick={handleCancel}
					class="flex-1"
					disabled={$submitting}
				>
					Cancelar
				</Button>
				<Form.Button type="submit" class="flex-1" disabled={$submitting}>
					{#if $submitting}
						<div class="flex items-center gap-2">
							<Spinner class="mr-2" />
							Criando...
						</div>
					{:else}
						<PlusIcon class="mr-2 h-4 w-4" />
						Criar Webhook
					{/if}
				</Form.Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>
