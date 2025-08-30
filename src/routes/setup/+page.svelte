<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Badge } from '$lib/components/ui/badge';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
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

<svelte:head>
	<title>Create Organization | NanoBrand</title>
</svelte:head>

<div class="grid min-h-svh bg-gradient-to-br from-blue-200 via-white to-purple-200 dark:from-gray-900 dark:via-background dark:to-stone-950">
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
							d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-6 4h6"
						/>
					</svg>
				</div>
				NanoBrand
			</a>
		</div>
		<div class="flex flex-1 items-center justify-center">
			<div class="w-full max-w-lg">
				<div class="flex flex-col gap-6">
					<div class="flex flex-col items-center gap-2 text-center">
						<div class="mx-auto w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
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
									d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-6 4h6"
								/>
							</svg>
						</div>
						<h1 class="text-2xl font-bold" data-testid="org-setup-title">
							Create your organization
						</h1>
						<p class="text-muted-foreground text-balance text-sm">
							Let's set up your workspace to get started with NanoBrand
						</p>
					</div>

					<Card.Root>
						<Card.Content class="px-6">
							<div class="grid gap-6">
								<div class="grid gap-3">
									<Label for="organizationName">Organization name</Label>
									<Input
										id="organizationName"
										name="organizationName"
										type="text"
										placeholder="My Company Inc."
										bind:value={organizationName}
										required
										disabled={loading}
										maxlength={50}
										data-testid="org-name-input"
									/>
									<p class="text-xs text-muted-foreground">
										This will be your workspace name and can be changed later
									</p>
								</div>

								<div class="grid gap-3">
									<Label for="industry">Industry/Category *</Label>
									<Select.Root
										type="single"
										bind:value={industry}
										disabled={loading}
									>
										<Select.Trigger class="w-full">
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

								<div class="grid gap-3">
									<Label for="description">What do you do *</Label>
									<Textarea
										id="description"
										name="description"
										placeholder="Briefly describe what your company does..."
										bind:value={description}
										class="resize-none"
										disabled={loading}
										maxlength={140}
										rows={3}
										required
									/>
									<p class="text-xs text-muted-foreground">
										{description.length}/140 characters
									</p>
								</div>

								<div class="grid gap-3">
									<Label>Brand voice (choose 1-3) *</Label>
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

								<div class="grid gap-3">
									<Label>Logo policy *</Label>
									<p class="text-xs text-muted-foreground">
										How often is your logo being used in your marketing materials?
									</p>
									<RadioGroup.Root bind:value={logoPolicy} disabled={loading}>
										<div class="flex flex-col sm:flex-row gap-4">
											{#each LOGO_POLICY_OPTIONS as option (option.value)}
												<div class="flex items-center space-x-2">
													<RadioGroup.Item value={option.value} id="logo-policy-{option.value}" />
													<Label for="logo-policy-{option.value}" class="text-sm cursor-pointer">{option.label}</Label>
												</div>
											{/each}
										</div>
									</RadioGroup.Root>
								</div>
							</div>
						</Card.Content>
					</Card.Root>

					{#if form?.error}
						<div class="text-sm text-destructive">{form.error}</div>
					{/if}

					<!-- Action Button -->
					<div class="flex gap-3 justify-end">
						<form
							method="POST"
							use:enhance={() => {
								loading = true;
								return async ({ update }) => {
									await update();
									loading = false;
								};
							}}
						>
							{#each brandVoice as voice (voice)}
								<input type="hidden" name="brandVoice" value={voice} />
							{/each}
							<input type="hidden" name="organizationName" value={organizationName} />
							<input type="hidden" name="industry" value={industry} />
							<input type="hidden" name="description" value={description} />
							<input type="hidden" name="logoPolicy" value={logoPolicy} />

							<Button
								type="submit"
								disabled={loading || !organizationName.trim() || !industry || !description.trim() || brandVoice.length === 0 || !logoPolicy}
								data-testid="create-org-button"
							>
								{#if loading}
									<div class="flex items-center gap-2">
										<div class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
										Creating organization...
									</div>
								{:else}
									Create organization
								{/if}
							</Button>
						</form>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>