<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import {
		ArrowLeftIcon,
		ImageIcon,
		SparklesIcon,
		EyeIcon
	} from '@lucide/svelte';
	import { PUBLIC_STORAGE_URL } from '$env/static/public';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import GenerateImageDialog from './components/generate-image-dialog.svelte';
	import ImageViewerDialog from './components/image-viewer-dialog.svelte';

	let { data }: { data: PageData } = $props();

	// Dialog state
	let isGenerateDialogOpen = $state(false);
	let isViewerDialogOpen = $state(false);
	let currentImageId = $state<string | null>(null);

	// Navigation
	function handleBack() {
		goto(`/orgs/${page.params.orgId}/products`);
	}

	function handleGenerateImage() {
		isGenerateDialogOpen = true;
	}

	function handleImageClick(image: typeof data.images[0]) {
		currentImageId = image.id;
		isViewerDialogOpen = true;
	}
</script>

<svelte:head>
	<title>{data.product.name} Gallery | NanoBrand</title>
</svelte:head>

<div class="w-full space-y-6 py-6">
	<!-- Header -->
	<div class="flex flex-col gap-4">
		<div class="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
			<div class="flex items-center gap-4">
				<Button variant="ghost" size="sm" onclick={handleBack} class="h-8 w-8 p-0">
					<ArrowLeftIcon class="h-4 w-4" />
				</Button>
				<div>
					<h1 class="text-3xl font-semibold tracking-tight">{data.product.name}</h1>
					<p class="text-muted-foreground">
						{data.images.length} generated image{data.images.length !== 1 ? 's' : ''}
					</p>
				</div>
			</div>

			{#if data.images && data.images.length > 0}
				<Button onclick={handleGenerateImage} class="gap-2">
					<SparklesIcon class="h-4 w-4" />
					Generate More Images
				</Button>
			{/if}
		</div>

		{#if data.product.tags && data.product.tags.length > 0}
			<div class="flex flex-wrap gap-2">
				{#each data.product.tags as tag (tag)}
					<Badge variant="secondary">{tag}</Badge>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Product Description -->
	{#if data.product.description}
		<Card.Root class="py-0 gap-0">
			<Card.Content class="p-6">
				<p class="text-muted-foreground leading-relaxed">
					{data.product.description}
				</p>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Gallery Content -->
	{#if data.images && data.images.length > 0}
		<!-- Images Grid -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
			{#each data.images as image (image.id)}
				<Card.Root class="group overflow-hidden transition-shadow hover:shadow-lg p-0">
					<button
						type="button"
						class="w-full aspect-square relative overflow-hidden bg-muted cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
						onclick={() => handleImageClick(image)}
						aria-label="View generated image {image.display_order}"
					>
						<img
							src={`${PUBLIC_STORAGE_URL}/${image.path}`}
							alt="Generated image {image.display_order}"
							class="w-full h-full object-cover transition-transform group-hover:scale-105"
						/>
						<div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
							<Button variant="secondary" size="sm" class="bg-white/90 hover:bg-white pointer-events-none text-black">
								<EyeIcon class="h-4 w-4 mr-1" />
								View
							</Button>
						</div>
						<!-- Order indicator -->
						<div class="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none">
							#{image.display_order}
						</div>
					</button>
				</Card.Root>
			{/each}
		</div>
	{:else}
		<!-- Empty State -->
		<Card.Root class="py-16 text-center">
			<Card.Content>
				<div class="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-muted">
					<ImageIcon class="h-16 w-16 text-muted-foreground" />
				</div>
				<h3 class="mb-4 text-xl font-semibold">No generated images yet</h3>
				<p class="mx-auto mb-8 max-w-md text-muted-foreground leading-relaxed">
					Start creating stunning visuals for <strong>{data.product.name}</strong> using AI image generation.
					Your reference images and product details will help create amazing results.
				</p>
				<Button onclick={handleGenerateImage} size="lg" class="gap-2">
					<SparklesIcon class="h-5 w-5" />
					Generate First Image
				</Button>
			</Card.Content>
		</Card.Root>
	{/if}
</div>

<!-- Generate Image Dialog -->
<GenerateImageDialog
	bind:open={isGenerateDialogOpen}
	product={data.product}
/>

<!-- Image Viewer Dialog -->
<ImageViewerDialog
	bind:open={isViewerDialogOpen}
	images={data.images}
	bind:currentImageId
/>