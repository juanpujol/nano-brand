<script lang="ts">
	import AuthLayout from '$lib/components/auth-layout.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let organizationName = $state('');
	let loading = $state(false);
</script>

<AuthLayout
	title="Crie sua organização"
	description="Vamos configurar seu espaço de trabalho para começar com o Laiki"
	iconGradient="from-purple-600 to-pink-600"
	backgroundGradient="from-purple-200 via-white to-pink-200"
	titleTestId="org-setup-title"
>
	{#snippet icon()}
		<svg
			class="h-8 w-8 text-white"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			aria-hidden="true"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width={2}
				d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-6 4h6"
			/>
		</svg>
	{/snippet}

	<form
		method="POST"
		use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				await update();
				loading = false;
			};
		}}
		class="space-y-6"
	>
		<div class="space-y-2">
			<Label for="organizationName" class="text-sm font-medium text-gray-700 dark:text-gray-300">
				Nome da organização
			</Label>
			<Input
				id="organizationName"
				name="organizationName"
				type="text"
				placeholder="Minha Empresa Ltda."
				bind:value={organizationName}
				required
				class="h-12 text-base"
				disabled={loading}
				maxlength={50}
				data-testid="org-name-input"
			/>
			<p class="text-xs text-gray-500 dark:text-gray-400">
				Este será o nome do seu espaço de trabalho e pode ser alterado posteriormente
			</p>
		</div>

		{#if form?.error}
			<div class="text-sm text-red-600">{form.error}</div>
		{/if}

		<div class="space-y-3">
			<Button
				type="submit"
				class="h-12 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-base text-white transition-all duration-200 hover:from-purple-700 hover:to-pink-700"
				disabled={loading || !organizationName.trim()}
				data-testid="create-org-button"
			>
				{#if loading}
					<div class="flex items-center gap-2">
						<div
							class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
						></div>
						Criando organização...
					</div>
				{:else}
					Criar organização
				{/if}
			</Button>
		</div>
	</form>

	{#snippet footer()}
		<div>
			<div class="relative">
				<div class="absolute inset-0 flex items-center">
					<div class="w-full border-t border-gray-200 dark:border-gray-700"></div>
				</div>
				<div class="relative flex justify-center text-xs uppercase">
					<span class="bg-white px-2 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
						O que você terá
					</span>
				</div>
			</div>

			<div class="mt-6 space-y-3">
				<div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
					<div
						class="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 dark:bg-green-900"
					>
						<svg
							class="h-3 w-3 text-green-600 dark:text-green-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width={2}
								d="M5 13l4 4L19 7"
							/>
						</svg>
					</div>
					<span>Workspace colaborativo para sua equipe</span>
				</div>
				<div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
					<div
						class="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 dark:bg-green-900"
					>
						<svg
							class="h-3 w-3 text-green-600 dark:text-green-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width={2}
								d="M5 13l4 4L19 7"
							/>
						</svg>
					</div>
					<span>Gerenciamento de projetos e tarefas</span>
				</div>
				<div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
					<div
						class="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 dark:bg-green-900"
					>
						<svg
							class="h-3 w-3 text-green-600 dark:text-green-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width={2}
								d="M5 13l4 4L19 7"
							/>
						</svg>
					</div>
					<span>Ferramentas de comunicação integradas</span>
				</div>
			</div>
		</div>
	{/snippet}
</AuthLayout>
