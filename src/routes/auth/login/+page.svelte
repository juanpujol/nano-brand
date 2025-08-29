<script lang="ts">
	import AuthLayout from '$lib/components/auth-layout.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { enhance } from '$app/forms';

	let { form } = $props();

	let loading = $state(false);
</script>

<AuthLayout
	title="Welcome to NanoBrand"
	description="Enter your email to get started"
	iconGradient="from-blue-600 to-purple-600"
	backgroundGradient="from-blue-200 via-white to-purple-200"
	titleTestId="login-title"
>
	{#snippet icon()}
		<svg
			class="h-8 w-8 text-white"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			role="img"
			aria-label="NanoBrand logo"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width={2}
				d="M13 10V3L4 14h7v7l9-11h-7z"
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
			<Label for="email" class="text-sm font-medium text-gray-700 dark:text-gray-300">
				Email address
			</Label>
			<Input
				id="email"
				name="email"
				type="email"
				placeholder="you@example.com"
				required
				class="h-12 text-base"
				disabled={loading}
				data-testid="email-input"
			/>
		</div>

		{#if form?.error}
			<div class="text-sm text-red-600">{form.error}</div>
		{/if}

		<Button
			type="submit"
			class="h-12 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-base text-white transition-all duration-200 hover:from-blue-700 hover:to-purple-700"
			disabled={loading}
			data-testid="submit-button"
		>
			{#if loading}
				<div class="flex items-center gap-2">
					<div
						class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
					></div>
					Sending code...
				</div>
			{:else}
				Send verification code
			{/if}
		</Button>
	</form>

	{#snippet footer()}
		<div class="text-center">
			<p class="text-xs text-gray-500 dark:text-gray-400">
				By continuing, you agree to our Terms of Service and Privacy Policy
			</p>
		</div>
	{/snippet}

	{#snippet outsideContent()}
		<div class="text-center">
			<p class="text-sm text-gray-600 dark:text-gray-400">
				We'll send you a verification code to sign in securely
			</p>
		</div>
	{/snippet}
</AuthLayout>
