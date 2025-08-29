<script lang="ts">
	import { Save, FileText } from '@lucide/svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Textarea } from '$lib/components/ui/textarea';
	import Label from '$lib/components/ui/label/label.svelte';
	import Spinner from '$lib/components/spinner.svelte';

	interface Props {
		open: boolean;
		currentPayload: unknown;
		onSave: (payload: unknown) => Promise<void>;
	}

	let { open = $bindable(), currentPayload, onSave }: Props = $props();

	let jsonString = $state('');
	let isLoading = $state(false);
	let validationError = $state<string | null>(null);

	// Reset form when dialog opens/closes or payload changes
	$effect(() => {
		if (open && currentPayload) {
			try {
				jsonString = JSON.stringify(currentPayload, null, 2);
				validationError = null;
			} catch {
				jsonString = '{}';
				validationError = 'Erro ao formatar o payload atual';
			}
		}
	});

	// Validate JSON on change
	$effect(() => {
		if (jsonString.trim()) {
			try {
				JSON.parse(jsonString);
				validationError = null;
			} catch {
				validationError = 'JSON inválido: verifique a sintaxe';
			}
		} else {
			validationError = null;
		}
	});

	function formatJson() {
		try {
			const parsed = JSON.parse(jsonString);
			jsonString = JSON.stringify(parsed, null, 2);
			validationError = null;
		} catch {
			validationError = 'Não foi possível formatar: JSON inválido';
		}
	}

	async function handleSave() {
		if (validationError) {
			return;
		}

		isLoading = true;
		try {
			const parsedPayload = jsonString.trim() ? JSON.parse(jsonString) : {};
			await onSave(parsedPayload);
			open = false;
		} catch (err) {
			console.error('Error saving payload:', err);
			validationError = 'Erro ao salvar o payload';
		} finally {
			isLoading = false;
		}
	}

	function handleCancel() {
		open = false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-h-[90vh] w-[90vw] !max-w-4xl overflow-y-auto sm:w-full">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<FileText class="h-5 w-5" />
				Editar payload do webhook
			</Dialog.Title>
			<Dialog.Description>
				Edite o JSON que representa o payload de exemplo recebido pelo webhook. Este payload é usado
				para mapear os campos corretamente.
			</Dialog.Description>
		</Dialog.Header>

		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleSave();
			}}
			class="space-y-4"
		>
			<!-- JSON Editor -->
			<div class="space-y-2">
				<div class="flex items-end justify-between">
					<Label for="payload-json" class="text-sm font-medium">Payload JSON</Label>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onclick={formatJson}
						disabled={isLoading}
						class="h-8 text-xs"
					>
						Formatar JSON
					</Button>
				</div>
				<Textarea
					id="payload-json"
					bind:value={jsonString}
					placeholder="Cole aqui o JSON do payload do webhook..."
					class="max-h-[500px] min-h-[300px] w-full resize-y overflow-x-auto bg-muted font-mono text-sm break-all"
					style="box-sizing: border-box; max-width: 100%;"
					disabled={isLoading}
				/>
				{#if validationError}
					<p class="text-sm text-red-600 dark:text-red-400">
						{validationError}
					</p>
				{:else}
					<p class="text-xs text-muted-foreground">
						Cole ou edite o JSON do payload. Use "Formatar JSON" para organizar a estrutura
						automaticamente.
					</p>
				{/if}
			</div>

			<!-- Action Buttons -->
			<div class="flex w-full justify-end gap-3 pt-4">
				<Button type="button" variant="outline" onclick={handleCancel} disabled={isLoading}>
					Cancelar
				</Button>
				<Button type="submit" disabled={isLoading || !!validationError}>
					{#if isLoading}
						<div class="flex items-center gap-2">
							<Spinner class="mr-2" />
							Salvando...
						</div>
					{:else}
						<Save class="mr-2 h-4 w-4" />
						Salvar payload
					{/if}
				</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>
