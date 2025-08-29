<script lang="ts">
	import AuthLayout from '$lib/components/auth-layout.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Select from '$lib/components/ui/select';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Badge } from '$lib/components/ui/badge';
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import { INDUSTRY_OPTIONS, BRAND_VOICE_OPTIONS, LOGO_POLICY_OPTIONS } from '$lib/constants/organization-onboarding';

	let { form }: { form: ActionData } = $props();

	let organizationName = $state('');
	let industry = $state('');
	let description = $state('');
	let brandVoice = $state<string[]>([]);
	let logoPolicy = $state('usually');
	let loading = $state(false);
</script>

<AuthLayout
	title="Create your organization"
	description="Let's set up your workspace to get started with NanoBrand"
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
				Organization name
			</Label>
			<Input
				id="organizationName"
				name="organizationName"
				type="text"
				placeholder="My Company Inc."
				bind:value={organizationName}
				required
				class="h-12 text-base"
				disabled={loading}
				maxlength={50}
				data-testid="org-name-input"
			/>
			<p class="text-xs text-gray-500 dark:text-gray-400">
				This will be your workspace name and can be changed later
			</p>
		</div>

		<div class="space-y-2">
			<Label for="industry" class="text-sm font-medium text-gray-700 dark:text-gray-300">
				Industry/Category *
			</Label>
			<Select.Root
				type="single"
				bind:value={industry}
				disabled={loading}
			>
				<Select.Trigger class="min-h-12 w-full">
					{industry ? INDUSTRY_OPTIONS.find(opt => opt.value === industry)?.label : 'Select your company industry'}
				</Select.Trigger>
				<Select.Content>
					{#each INDUSTRY_OPTIONS as option (option.value)}
						<Select.Item value={option.value}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<input type="hidden" name="industry" value={industry} />
		</div>

		<div class="space-y-2">
			<Label for="description" class="text-sm font-medium text-gray-700 dark:text-gray-300">
				What do you do *
			</Label>
			<Textarea
				id="description"
				name="description"
				placeholder="Briefly describe what your company does..."
				bind:value={description}
				class="text-base resize-none"
				disabled={loading}
				maxlength={140}
				rows={3}
				required
			/>
			<p class="text-xs text-gray-500 dark:text-gray-400">
				{description.length}/140 characters
			</p>
		</div>

		<div class="space-y-3">
			<Label class="text-sm font-medium text-gray-700 dark:text-gray-300">
				Brand voice (choose 1-3) *
			</Label>
			<div class="flex flex-wrap gap-2">
				{#each BRAND_VOICE_OPTIONS as option (option.value)}
					<button
						type="button"
						class="transition-all"
						disabled={loading}
						onclick={() => {
							if (brandVoice.includes(option.value)) {
								brandVoice = brandVoice.filter(v => v !== option.value);
							} else if (brandVoice.length < 3) {
								brandVoice = [...brandVoice, option.value];
							}
						}}
					>
						<Badge
							variant={brandVoice.includes(option.value) ? 'default' : 'outline'}
							class="cursor-pointer hover:bg-primary hover:text-primary-foreground"
						>
							{option.label}
						</Badge>
					</button>
				{/each}
			</div>
			{#each brandVoice as voice (voice)}
				<input type="hidden" name="brandVoice" value={voice} />
			{/each}
		</div>

		<div class="space-y-3">
			<Label class="text-sm font-medium text-gray-700 dark:text-gray-300">
				Logo policy *
			</Label>
			<div class="space-y-2">
				{#each LOGO_POLICY_OPTIONS as option (option.value)}
					<label class="flex items-center gap-3 cursor-pointer">
						<input
							type="radio"
							name="logoPolicy"
							value={option.value}
							bind:group={logoPolicy}
							disabled={loading}
							class="h-4 w-4 text-primary"
						/>
						<span class="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
					</label>
				{/each}
			</div>
		</div>

		{#if form?.error}
			<div class="text-sm text-red-600">{form.error}</div>
		{/if}

		<div class="space-y-3">
			<Button
				type="submit"
				class="h-12 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-base text-white transition-all duration-200 hover:from-purple-700 hover:to-pink-700"
				disabled={loading || !organizationName.trim() || !industry || !description.trim() || brandVoice.length === 0 || !logoPolicy}
				data-testid="create-org-button"
			>
				{#if loading}
					<div class="flex items-center gap-2">
						<div
							class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
						></div>
						Creating organization...
					</div>
				{:else}
					Create organization
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
						What you'll get
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
					<span>Collaborative workspace for your team</span>
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
					<span>Project and task management</span>
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
					<span>Integrated communication tools</span>
				</div>
			</div>
		</div>
	{/snippet}
</AuthLayout>
