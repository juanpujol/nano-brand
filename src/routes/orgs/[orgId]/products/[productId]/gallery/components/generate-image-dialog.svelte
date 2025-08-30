<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { SparklesIcon } from '@lucide/svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { toast } from 'svelte-sonner';
	import type { Product } from '$lib/schemas/product';

	interface Props {
		open: boolean;
		product: Product;
	}

	let { open = $bindable(), product }: Props = $props();

	// Form state
	let prompt = $state('');
	let loading = $state(false);

	// Character limits
	const MAX_CHARS = 500;
	const remainingChars = $derived(MAX_CHARS - prompt.length);

	function handleCancel() {
		prompt = '';
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

		loading = true;

		try {
			// TODO: Implement actual image generation API call
			// Simulate generation delay for now
			await new Promise(resolve => setTimeout(resolve, 2000));

			toast.success('Image generation started! Check back in a few moments.');
			handleCancel(); // Close dialog and reset form
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
				Create stunning AI-generated images for your product. Describe what you want to see and our AI will bring it to life.
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

			<!-- Suggested Prompts -->
			{#if suggestedPrompts.length > 0}
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
					disabled={loading || !prompt.trim() || remainingChars < 0}
				>
					{#if loading}
						<div class="flex items-center gap-2">
							<div class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
							Generating...
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