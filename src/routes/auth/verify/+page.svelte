<script lang="ts">
	import AuthLayout from '$lib/components/auth-layout.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as InputOTP from '$lib/components/ui/input-otp';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let otp = $state('');
	let loading = $state(false);

	function handleBack() {
		window.location.href = '/auth/login';
	}
</script>

<AuthLayout
	title="Verify your email"
	iconGradient="from-green-500 to-blue-600"
	backgroundGradient="from-blue-200 via-white to-purple-200"
	onBack={handleBack}
	titleTestId="otp-title"
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
				d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
			/>
		</svg>
	{/snippet}

	{#snippet description()}
		<div>
			<p class="mb-1 text-gray-600 dark:text-gray-400">We sent a verification code to</p>
			<p class="text-sm font-medium text-gray-900 dark:text-white">{data.email}</p>
		</div>
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
		<input type="hidden" name="email" value={data.email} />

		<div class="space-y-4">
			<div class="flex justify-center">
				<InputOTP.Root
					maxlength={6}
					bind:value={otp}
					onValueChange={(value) => {
						otp = value;
						// Auto-submit when 6 digits are entered
						if (value.length === 6) {
							setTimeout(() => {
								const form = document.querySelector('form');
								if (form && otp.length === 6) {
									form.requestSubmit();
								}
							}, 100);
						}
					}}
					disabled={loading}
					data-testid="otp-input"
				>
					{#snippet children({ cells })}
						<InputOTP.Group>
							{#each cells as cell, index (index)}
								<InputOTP.Slot {cell} class="h-12 w-12 text-lg" />
							{/each}
						</InputOTP.Group>
					{/snippet}
				</InputOTP.Root>
			</div>

			<input type="hidden" name="token" bind:value={otp} />

			{#if form?.error}
				<div class="text-center text-sm text-red-600">{form.error}</div>
			{/if}

			<div class="text-center">
				<a
					href="/auth/login"
					class="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
					data-testid="resend-link"
				>
					Resend code
				</a>
			</div>
		</div>

		<Button
			type="submit"
			class="h-12 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-base text-white transition-all duration-200 hover:from-blue-700 hover:to-purple-700"
			disabled={loading || otp.length !== 6}
			data-testid="verify-button"
		>
			{#if loading}
				<div class="flex items-center gap-2">
					<div
						class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
					></div>
					Verifying...
				</div>
			{:else}
				Verify code
			{/if}
		</Button>
	</form>

	{#snippet footer()}
		<div class="text-center">
			<p class="text-xs text-gray-500 dark:text-gray-400">
				Didn't receive the code? Check your spam folder
			</p>
		</div>
	{/snippet}
</AuthLayout>
