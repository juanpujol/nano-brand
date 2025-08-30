<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as InputOTP from '$lib/components/ui/input-otp';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import { enhance } from '$app/forms';
	import { ArrowLeftIcon } from '@lucide/svelte';

	let { data, form } = $props();

	let otp = $state('');
	let loading = $state(false);

	function handleBack() {
		window.location.href = '/auth/login';
	}
</script>

<svelte:head>
	<title>Verify Email | NanoBrand</title>
</svelte:head>

<div class="grid min-h-svh lg:grid-cols-2">
	<!-- Theme Toggle -->
	<div class="absolute top-6 right-6 z-10">
		<ThemeToggle />
	</div>

	<div class="flex flex-col gap-4 p-6 md:p-10">
		<div class="flex justify-center gap-2 md:justify-start">
			<button
				type="button"
				onclick={handleBack}
				class="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
				data-testid="back-button"
			>
				<ArrowLeftIcon class="h-4 w-4" />
				<span class="text-sm">Back to login</span>
			</button>
		</div>
		<div class="flex flex-1 items-center justify-center">
			<div class="w-full max-w-xs">
				<form
					class="flex flex-col gap-6"
					method="POST"
					use:enhance={() => {
						loading = true;
						return async ({ update }) => {
							await update();
							loading = false;
						};
					}}
				>
					<div class="flex flex-col items-center gap-2 text-center">
						<div class="mx-auto w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
							<svg
								class="h-7 w-7 text-white"
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
						</div>
						<h1 class="text-2xl font-bold" data-testid="otp-title">
							Verify your email
						</h1>
						<div class="text-muted-foreground text-balance text-sm text-center">
							<p>We sent a verification code to</p>
							<p class="font-medium text-foreground">{data.email}</p>
						</div>
					</div>
					<div class="grid gap-6">
						<input type="hidden" name="email" value={data.email} />

						<div class="flex justify-center">
							<InputOTP.Root
								maxlength={6}
								bind:value={otp}
								disabled={loading}
								data-testid="otp-input"
							>
								{#snippet children({ cells })}
									<InputOTP.Group>
										{#each cells as cell, index (index)}
											<InputOTP.Slot {cell} />
										{/each}
									</InputOTP.Group>
								{/snippet}
							</InputOTP.Root>
						</div>

						<input type="hidden" name="token" bind:value={otp} />

						{#if form?.error}
							<div class="text-center text-sm text-destructive">{form.error}</div>
						{/if}

						<Button
							type="submit"
							class="w-full"
							disabled={loading || otp.length !== 6}
							data-testid="verify-button"
						>
							{#if loading}
								<div class="flex items-center gap-2">
									<div class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
									Verifying...
								</div>
							{:else}
								Verify code
							{/if}
						</Button>
					</div>
					<div class="text-center text-sm text-muted-foreground">
						Didn't receive the code?
						<a href="/auth/login" class="underline underline-offset-4 hover:text-foreground" data-testid="resend-link">
							Resend code
						</a>
					</div>
				</form>
			</div>
		</div>
	</div>
	<div class="bg-muted relative hidden lg:block">
		<div class="absolute inset-0 bg-gradient-to-br from-green-500/20 to-blue-600/20"></div>
		<div class="absolute inset-0 flex items-center justify-center">
			<div class="text-center space-y-4 text-white">
				<h2 class="text-4xl font-bold">Almost there!</h2>
				<p class="text-xl opacity-90">Check your email for the verification code</p>
			</div>
		</div>
	</div>
</div>
