<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import {
		XIcon,
		ChevronLeftIcon,
		ChevronRightIcon,
		DownloadIcon,
		Trash2Icon
	} from '@lucide/svelte';
	import { PUBLIC_STORAGE_URL } from '$env/static/public';

	interface ImageData {
		id: string;
		path: string;
		display_order: number;
		created_at: string;
	}

	interface Props {
		open: boolean;
		images: ImageData[];
		currentImageId: string | null;
	}

	let { open = $bindable(), images, currentImageId = $bindable() }: Props = $props();

	// Find current image index
	const currentIndex = $derived(() => {
		if (!currentImageId || !images.length) return 0;
		const index = images.findIndex(img => img.id === currentImageId);
		return index >= 0 ? index : 0;
	});

	const currentImage = $derived(images[currentIndex()]);

	// Navigation functions
	function goToPrevious() {
		const newIndex = currentIndex() > 0 ? currentIndex() - 1 : images.length - 1;
		currentImageId = images[newIndex].id;
	}

	function goToNext() {
		const newIndex = currentIndex() < images.length - 1 ? currentIndex() + 1 : 0;
		currentImageId = images[newIndex].id;
	}

	// Keyboard navigation
	function handleKeydown(event: KeyboardEvent) {
		if (!open) return;

		switch (event.key) {
			case 'ArrowLeft':
				event.preventDefault();
				goToPrevious();
				break;
			case 'ArrowRight':
				event.preventDefault();
				goToNext();
				break;
			case 'Escape':
				event.preventDefault();
				open = false;
				break;
		}
	}

	// Download image
	function handleDownload() {
		if (!currentImage) return;

		const link = document.createElement('a');
		link.href = `${PUBLIC_STORAGE_URL}/${currentImage.path}`;
		link.download = `generated-image-${currentImage.display_order}.png`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	// Delete image (TODO: Implement delete functionality)
	function handleDelete() {
		console.log('Delete image:', currentImage);
		// TODO: Implement delete functionality
	}

	// Format date
	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-5xl w-[95vw] p-0 bg-black/95">
		{#if currentImage}
			<!-- Header -->
			<div class="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
				<div class="flex items-center gap-3">
					<Badge variant="secondary" class="bg-white/10 text-white border-white/20">
						#{currentImage.display_order}
					</Badge>
					<span class="text-white/80 text-sm">
						{currentIndex() + 1} of {images.length}
					</span>
				</div>

				<div class="flex items-center gap-2">
					<!-- Download button -->
					<Button
						variant="ghost"
						size="sm"
						onclick={handleDownload}
						class="text-white hover:bg-white/10 h-8 w-8 p-0"
						title="Download image"
					>
						<DownloadIcon class="h-4 w-4" />
					</Button>

					<!-- Delete button -->
					<Button
						variant="ghost"
						size="sm"
						onclick={handleDelete}
						class="text-white hover:bg-white/10 hover:text-red-400 h-8 w-8 p-0"
						title="Delete image"
					>
						<Trash2Icon class="h-4 w-4" />
					</Button>

					<!-- Close button -->
					<Button
						variant="ghost"
						size="sm"
						onclick={() => open = false}
						class="text-white hover:bg-white/10 h-8 w-8 p-0"
						title="Close viewer"
					>
						<XIcon class="h-4 w-4" />
					</Button>
				</div>
			</div>

			<!-- Main image container -->
			<div class="relative w-full h-full flex items-center justify-center p-16">
				<!-- Previous button -->
				{#if images.length > 1}
					<Button
						variant="ghost"
						size="lg"
						onclick={goToPrevious}
						class="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 p-0 text-white hover:bg-white/10 rounded-full"
						title="Previous image (←)"
					>
						<ChevronLeftIcon class="h-6 w-6" />
					</Button>
				{/if}

				<!-- Image -->
				<img
					src={`${PUBLIC_STORAGE_URL}/${currentImage.path}`}
					alt="Generated image {currentImage.display_order}"
					class="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
				/>

				<!-- Next button -->
				{#if images.length > 1}
					<Button
						variant="ghost"
						size="lg"
						onclick={goToNext}
						class="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 p-0 text-white hover:bg-white/10 rounded-full"
						title="Next image (→)"
					>
						<ChevronRightIcon class="h-6 w-6" />
					</Button>
				{/if}
			</div>

			<!-- Footer with image info -->
			<div class="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/80 to-transparent">
				<div class="flex items-center justify-between text-white/80">
					<div class="text-sm">
						Generated on {formatDate(currentImage.created_at)}
					</div>
					{#if images.length > 1}
						<div class="text-sm">
							Use ← → arrow keys to navigate
						</div>
					{/if}
				</div>
			</div>

			<!-- Thumbnail strip for multiple images -->
			{#if images.length > 1}
				<div class="absolute bottom-16 left-1/2 -translate-x-1/2 z-10">
					<div class="flex gap-2 bg-black/50 p-2 rounded-lg backdrop-blur-sm">
						{#each images as image (image.id)}
							<button
								type="button"
								class="w-12 h-12 rounded overflow-hidden transition-all hover:scale-110"
								class:ring-2={currentImageId === image.id}
								class:ring-white={currentImageId === image.id}
								class:ring-offset-2={currentImageId === image.id}
								class:ring-offset-black={currentImageId === image.id}
								onclick={() => currentImageId = image.id}
								title="View image {image.display_order}"
							>
								<img
									src={`${PUBLIC_STORAGE_URL}/${image.path}`}
									alt="Thumbnail {image.display_order}"
									class="w-full h-full object-cover"
								/>
							</button>
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	</Dialog.Content>
</Dialog.Root>