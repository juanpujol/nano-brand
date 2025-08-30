<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Switch } from '$lib/components/ui/switch';
	import * as Select from '$lib/components/ui/select';
	import { SparklesIcon, ChevronDownIcon, ChevronUpIcon } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { generateImage } from '$lib/remote/gemini.remote';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import type { Product } from '$lib/schemas/product';

	interface Props {
		open: boolean;
		product: Product;
	}

	let { open = $bindable(), product }: Props = $props();

	// Form state
	let prompt = $state('');
	let loading = $state(false);

	// Image generation options
	let includeLogo = $state(true);
	let includeReferenceImages = $state(true);
	let aspectRatio = $state('1:1');
	let negativePrompt = $state('');
	let showAdvanced = $state(false);

	// Character limits
	const MAX_CHARS = 500;
	const NEGATIVE_MAX_CHARS = 200;
	const remainingChars = $derived(MAX_CHARS - prompt.length);
	const negativeRemainingChars = $derived(NEGATIVE_MAX_CHARS - negativePrompt.length);

	// Aspect ratio options
	const aspectRatioOptions = [
		{ value: '1:1', label: 'Square (1:1)' },
		{ value: '16:9', label: 'Landscape (16:9)' },
		{ value: '9:16', label: 'Portrait (9:16)' },
		{ value: '4:3', label: 'Standard (4:3)' },
		{ value: '3:4', label: 'Portrait (3:4)' }
	];

	function handleCancel() {
		prompt = '';
		negativePrompt = '';
		includeLogo = true;
		includeReferenceImages = true;
		aspectRatio = '1:1';
		showAdvanced = false;
		open = false;
	}

	async function handleGenerate() {
		if (!prompt.trim()) {
			toast.error('Please enter a prompt for image generation');
			return;
		}

		if (prompt.length > MAX_CHARS) {
			toast.error(`Prompt is too long. Maximum ${MAX_CHARS} characters allowed.`);
			return;
		}

		if (negativePrompt.length > NEGATIVE_MAX_CHARS) {
			toast.error(`Negative prompt is too long. Maximum ${NEGATIVE_MAX_CHARS} characters allowed.`);
			return;
		}

		loading = true;

		try {
			const result = await generateImage({
				organizationId: page.params.orgId!,
				productId: product.id,
				prompt: prompt.trim(),
				aspectRatio: aspectRatio as '1:1' | '9:16' | '16:9' | '3:4' | '4:3',
				negativePrompt: negativePrompt.trim() || undefined,
				includeLogo,
				includeReferenceImages
			});

			if (result.success) {
				toast.success('Image generated successfully! 🎨');
				await invalidateAll(); // Refresh gallery to show new image
				handleCancel(); // Reset form and close dialog
			} else {
				toast.error(result.error || 'Failed to generate image. Please try again.');
			}
		} catch (error) {
			console.error('Error generating image:', error);
			toast.error('Failed to generate image. Please try again.');
		} finally {
			loading = false;
		}
	}

	// Suggested prompts based on product
	let suggestedPrompts = $state<string[]>([]);

	$effect(() => {
		const base = `${product.name}`;
		const tags = product.tags?.join(', ') || '';

		suggestedPrompts = [
			`Professional product photo of ${base}, clean white background, studio lighting`,
			`${base} in a lifestyle setting, natural lighting, high quality`,
			`Minimalist ${base} showcase, modern aesthetic, premium look`,
			tags ? `${base} featuring ${tags}, commercial photography style` : null
		].filter(Boolean) as string[];
	});

	function handleSuggestedPrompt(suggestion: string) {
		prompt = suggestion;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-h-[90vh] w-[90vw] max-w-2xl overflow-y-auto sm:w-full">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<SparklesIcon class="h-5 w-5" />
				Generate Image for {product.name}
			</Dialog.Title>
			<Dialog.Description>
				Create stunning AI-generated images for your product. Our AI will automatically incorporate your brand guidelines and product context. Just describe what you want to see!
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-6">
			<!-- Prompt Input -->
			<div class="space-y-2">
				<Label for="prompt">Image Prompt *</Label>
				<Textarea
					id="prompt"
					placeholder="Describe the image you want to generate... e.g., 'Professional product photo with clean white background and studio lighting'"
					bind:value={prompt}
					disabled={loading}
					rows={4}
					class="min-h-[100px] resize-none"
					maxlength={MAX_CHARS}
				/>
				<div class="flex flex-col text-xs gap-1">
					<span class="text-muted-foreground">
						Be specific about style, lighting, background, and composition
					</span>
					<span class="text-muted-foreground" class:text-destructive={remainingChars < 0}>
						{remainingChars} characters remaining
					</span>
				</div>
			</div>

			<!-- Generation Options -->
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<div class="space-y-0.5">
						<Label class="text-sm font-medium">Include brand logo</Label>
						<p class="text-xs text-muted-foreground">Add your organization's logo to the generated image</p>
					</div>
					<Switch bind:checked={includeLogo} disabled={loading} />
				</div>

				<div class="flex items-center justify-between">
					<div class="space-y-0.5">
						<Label class="text-sm font-medium">Include reference images</Label>
						<p class="text-xs text-muted-foreground">Use product reference images for style and context</p>
					</div>
					<Switch bind:checked={includeReferenceImages} disabled={loading} />
				</div>

				<div class="space-y-2">
					<Label class="text-sm font-medium">Aspect ratio</Label>
					<Select.Root
						type="single"
						value={aspectRatio}
						onValueChange={(value: string | undefined) => {
							if (value) aspectRatio = value;
						}}
						disabled={loading}
					>
						<Select.Trigger class="w-full">
							{aspectRatioOptions.find(opt => opt.value === aspectRatio)?.label || 'Select aspect ratio'}
						</Select.Trigger>
						<Select.Content>
							{#each aspectRatioOptions as option (option.value)}
								<Select.Item value={option.value}>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<!-- Advanced Options -->
				<div class="space-y-3">
					<button
						type="button"
						class="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
						onclick={() => showAdvanced = !showAdvanced}
						disabled={loading}
					>
						{showAdvanced ? 'Hide' : 'Show'} advanced options
						{#if showAdvanced}
							<ChevronUpIcon class="h-4 w-4" />
						{:else}
							<ChevronDownIcon class="h-4 w-4" />
						{/if}
					</button>

					{#if showAdvanced}
						<div class="space-y-2 border-l-2 border-muted pl-4">
							<Label for="negative-prompt" class="text-sm font-medium">What to avoid (optional)</Label>
							<Textarea
								id="negative-prompt"
								placeholder="e.g., 'blurry, low quality, text, watermarks'"
								bind:value={negativePrompt}
								disabled={loading}
								rows={2}
								class="min-h-[60px] resize-none"
								maxlength={NEGATIVE_MAX_CHARS}
							/>
							<div class="flex justify-between text-xs">
								<span class="text-muted-foreground">
									Describe what you don't want to see in the image
								</span>
								<span class="text-muted-foreground" class:text-destructive={negativeRemainingChars < 0}>
									{negativeRemainingChars} characters remaining
								</span>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Suggested Prompts -->
			{#if suggestedPrompts.length > 0 && false}
				<div class="space-y-3">
					<Label class="text-sm font-medium">Suggested Prompts</Label>
					<div class="space-y-2">
						{#each suggestedPrompts as suggestion (suggestion)}
							<button
								type="button"
								onclick={() => handleSuggestedPrompt(suggestion)}
								disabled={loading}
								class="w-full text-left p-3 text-sm border rounded-md hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{suggestion}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Action Buttons -->
			<div class="flex gap-3 pt-4">
				<Button
					type="button"
					variant="outline"
					onclick={handleCancel}
					class="flex-1"
					disabled={loading}
				>
					Cancel
				</Button>
				<Button
					type="button"
					onclick={handleGenerate}
					class="flex-1"
					disabled={loading || !prompt.trim() || remainingChars < 0 || negativeRemainingChars < 0}
				>
					{#if loading}
						<div class="flex items-center gap-2">
							<div class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
							Generating image...
						</div>
					{:else}
						<SparklesIcon class="mr-2 h-4 w-4" />
						Generate Image
					{/if}
				</Button>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>