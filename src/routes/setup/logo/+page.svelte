<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import { enhance } from '$app/forms';
	import { ArrowRight, UploadIcon } from '@lucide/svelte';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import type ColorThief from 'colorthief';
	import { extractColorsFromImage } from './utils/color-extraction';

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let { data }: { data: PageData } = $props();

	let files = $state<FileList>();
	let imagePreview = $state<string>('');
	let loading = $state(false);
	let dragOver = $state(false);
	let colorThief: ColorThief | undefined = $state();

	// Extracted colors placeholder
	let extractedColors = $state<string[]>(['#3B82F6', '#8B5CF6', '#EC4899']);

	onMount(async () => {
		const ColorThief = (await import('colorthief')).default;
		colorThief = new ColorThief();
	});

	// Extract colors from image using utility function
	function handleColorExtraction(img: EventTarget & Element) {
		if (!colorThief || !(img instanceof HTMLImageElement)) return;
		
		const colors = extractColorsFromImage(colorThief, img);
		extractedColors = colors;
	}

	// Handle file selection
	function handleFileSelect(selectedFiles: FileList | undefined) {
		if (!selectedFiles || selectedFiles.length === 0) return;

		const file = selectedFiles[0];

		// Validate file type
		if (!file.type.startsWith('image/')) {
			alert('Please select a valid image file');
			return;
		}

		// Validate file size (5MB limit)
		if (file.size > 5 * 1024 * 1024) {
			alert('File size must be less than 5MB');
			return;
		}

		files = selectedFiles;

		// Create preview
		const reader = new FileReader();
		reader.onload = (e) => {
			imagePreview = e.target?.result as string;
		};
		reader.readAsDataURL(file);
	}

	// Handle drag and drop
	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		dragOver = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		dragOver = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;

		const droppedFiles = e.dataTransfer?.files;
		if (droppedFiles) {
			handleFileSelect(droppedFiles);
		}
	}

	function clearImage() {
		files = undefined;
		imagePreview = '';
		extractedColors = ['#3B82F6', '#8B5CF6', '#EC4899'];
	}
</script>

<svelte:head>
	<title>Add Brand Logo | NanoBrand</title>
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
							d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z"
						/>
					</svg>
				</div>
				NanoBrand
			</a>
		</div>

		<div class="flex flex-1 items-center justify-center">
			<div class="w-full max-w-2xl">
				<div class="flex flex-col gap-6">
					<div class="flex flex-col items-center gap-2 text-center">
						<div class="mx-auto w-12 h-12 rounded-lg bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center">
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
									d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z"
								/>
							</svg>
						</div>
						<h1 class="text-2xl font-bold" data-testid="logo-upload-title">
							Add your brand logo
						</h1>
						<p class="text-muted-foreground text-balance text-sm">
							Upload your logo and we'll extract your brand colors
						</p>
					</div>

					<Card.Root>
						<Card.Content class="px-6">
							<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
								<!-- Left Column: Logo Upload -->
								<div class="space-y-6 sm:border-r border-border sm:pr-6">
									<div class="text-center">
										<h3 class="text-lg font-semibold">Upload Logo</h3>
										<p class="text-sm text-muted-foreground mt-1">Add your brand logo</p>
									</div>

									{#if !imagePreview}
										<div
											class="border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer {dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}"
											role="button"
											tabindex="0"
											onclick={() => document.getElementById('logo-upload')?.click()}
											onkeydown={(e) => e.key === 'Enter' && document.getElementById('logo-upload')?.click()}
											ondragover={handleDragOver}
											ondragleave={handleDragLeave}
											ondrop={handleDrop}
										>
											<div class="flex flex-col items-center justify-center text-center space-y-4">
												<div class="p-4 rounded-full bg-muted">
													<UploadIcon class="h-8 w-8 text-muted-foreground" />
												</div>
												<div>
													<p class="font-medium">
														Drag and drop your logo
													</p>
													<p class="text-sm text-muted-foreground">
														or click to browse files
													</p>
												</div>
												<div class="text-xs text-muted-foreground">
													PNG, JPG, JPEG, SVG • Max 5MB
												</div>
											</div>
										</div>

										<Input
											id="logo-upload"
											type="file"
											accept="image/*"
											bind:files
											onchange={() => handleFileSelect(files)}
											class="hidden"
										/>
									{:else}
										<!-- Image Preview -->
										<div class="space-y-4">
											<div class="flex items-center justify-between">
												<Label class="text-sm font-medium">Logo Preview</Label>
												<Button variant="outline" size="sm" onclick={clearImage}>
													Remove
												</Button>
											</div>
											<div class="flex justify-center p-6 bg-muted rounded-lg">
												<img
													src={imagePreview}
													alt="Logo preview"
													class="max-h-32 max-w-full object-contain"
													onload={(e) => handleColorExtraction(e.currentTarget)}
													crossorigin="anonymous"
												/>
											</div>
										</div>
									{/if}
								</div>

								<!-- Right Column: Brand Colors -->
								<div class="space-y-6">
									<div class="text-center">
										<h3 class="text-lg font-semibold">Brand Colors</h3>
										<p class="text-sm text-muted-foreground mt-1">
											{imagePreview ? 'Extracted colors' : 'Choose your colors'}
										</p>
									</div>

									<div class="flex flex-col gap-4 items-center">
										{#each extractedColors as color, index (index)}
											<div class="flex items-center space-x-4">
												<div class="flex-shrink-0 w-16">
													<Label class="text-sm font-medium">
														Color {index + 1}
													</Label>
												</div>

												<!-- Color Picker and Hex -->
												<div class="flex items-center space-x-3 flex-1">
													<input
														type="color"
														bind:value={extractedColors[index]}
														class="w-16 h-12 rounded border-2 border-border cursor-pointer"
														title="Choose color {index + 1}"
													/>
													<div class="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
														{color.toUpperCase()}
													</div>
												</div>
											</div>
										{/each}

										<div class="pt-4 border-t border-border">
											<p class="text-xs text-muted-foreground text-center">
												These colors will be used throughout your brand materials
											</p>
										</div>
									</div>
								</div>
							</div>
						</Card.Content>
					</Card.Root>

					<!-- Action Buttons -->
					<div class="flex gap-3 justify-end">
						<form
							method="POST"
							action="?/continue"
							use:enhance={() => {
								loading = true;
								return async ({ update }) => {
									await update();
									loading = false;
								};
							}}
						>
							<Button
								type="submit"
								disabled={loading}
							>
								{#if loading}
									<div class="flex items-center gap-2">
										<div class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
										Saving...
									</div>
								{:else}
									Continue to dashboard
									<ArrowRight class="w-4 h-4 ml-2" />
								{/if}
							</Button>
						</form>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>