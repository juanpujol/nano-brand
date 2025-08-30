<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import { enhance } from '$app/forms';

	let { form } = $props();

	let loading = $state(false);
</script>

<svelte:head>
	<title>Sign In | NanoBrand</title>
</svelte:head>

<div class="grid min-h-svh lg:grid-cols-2">
	<!-- Theme Toggle -->
	<div class="absolute top-6 right-6 z-10">
		<ThemeToggle />
	</div>
	
	<div class="flex flex-col gap-4 p-6 md:p-10">
		<div class="flex justify-center gap-2 md:justify-start">
			<a href="/" class="flex items-center gap-2 font-medium">
				<div class="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
					<svg
						class="size-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width={2}
							d="M13 10V3L4 14h7v7l9-11h-7z"
						/>
					</svg>
				</div>
				NanoBrand
			</a>
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
					<div class="flex flex-col gap-2">
						<h1 class="text-2xl font-bold" data-testid="login-title">
							Sign in/up
						</h1>
						<p class="text-muted-foreground text-balance text-sm">
							Enter your email below to get started
						</p>
					</div>
					<div class="grid gap-6">
						<div class="grid gap-3">
							<Label for="email">Email</Label>
							<Input
								id="email"
								name="email"
								type="email"
								placeholder="you@example.com"
								required
								disabled={loading}
								data-testid="email-input"
							/>
						</div>

						{#if form?.error}
							<div class="text-sm text-destructive">{form.error}</div>
						{/if}

						<Button
							type="submit"
							class="w-full"
							disabled={loading}
							data-testid="submit-button"
						>
							{#if loading}
								<div class="flex items-center gap-2">
									<div class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
									Sending code...
								</div>
							{:else}
								Send verification code
							{/if}
						</Button>
					</div>
					<div class="text-sm text-muted-foreground">
						We'll send you a verification code to sign in securely. No passwords!
					</div>
				</form>
			</div>
		</div>
	</div>
	<div class="bg-muted relative hidden lg:block">
		<div class="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20"></div>
		<div class="absolute inset-0 flex items-center justify-center">
			<div class="text-center space-y-4 text-white">
				<h2 class="text-4xl font-bold">Welcome to NanoBrand</h2>
				<p class="text-xl opacity-90">Streamline your brand management</p>
			</div>
		</div>
	</div>
</div>
