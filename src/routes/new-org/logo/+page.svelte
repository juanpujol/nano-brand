<script lang="ts">
	import AuthLayout from '$lib/components/auth-layout.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { enhance } from '$app/forms';
	import { UploadIcon, ImageIcon } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let files = $state<FileList>();
	let imagePreview = $state<string>('');
	let loading = $state(false);
	let dragOver = $state(false);

	// Extracted colors placeholder
	let extractedColors = $state<string[]>(['#3B82F6', '#8B5CF6', '#EC4899']);

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

<AuthLayout
	title="Add your brand logo"
	description="Upload your logo and we'll extract your brand colors"
	iconGradient="from-green-600 to-blue-600"
	backgroundGradient="from-green-200 via-white to-blue-200"
	titleTestId="logo-upload-title"
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
				d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
			/>
		</svg>
	{/snippet}

	<Card>
		<CardContent class="p-8">
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
				<!-- Left Column: Logo Upload -->
				<div class="space-y-6">
					<div class="text-center">
						<h3 class="text-lg font-semibold text-gray-900 dark:text-white">Upload Logo</h3>
						<p class="text-sm text-gray-500 mt-1">Add your brand logo</p>
					</div>

					{#if !imagePreview}
						<div 
							class="border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer {dragOver ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}"
							role="button"
							tabindex="0"
							onclick={() => document.getElementById('logo-upload')?.click()}
							ondragover={handleDragOver}
							ondragleave={handleDragLeave}
							ondrop={handleDrop}
						>
							<div class="flex flex-col items-center justify-center text-center space-y-4">
								<div class="p-4 rounded-full bg-gray-100 dark:bg-gray-800">
									<UploadIcon class="h-8 w-8 text-gray-600 dark:text-gray-400" />
								</div>
								<div>
									<p class="font-medium text-gray-900 dark:text-white">
										Drag and drop your logo here
									</p>
									<p class="text-sm text-gray-500 dark:text-gray-400">
										or click to browse files
									</p>
								</div>
								<div class="text-xs text-gray-400">
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
								<Button variant="ghost" size="sm" onclick={clearImage}>
									Remove
								</Button>
							</div>
							<div class="flex justify-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
								<img 
									src={imagePreview} 
									alt="Logo preview" 
									class="max-h-32 max-w-full object-contain"
								/>
							</div>
						</div>
					{/if}
				</div>

				<!-- Right Column: Brand Colors -->
				<div class="space-y-6">
					<div class="text-center">
						<h3 class="text-lg font-semibold text-gray-900 dark:text-white">Brand Colors</h3>
						<p class="text-sm text-gray-500 mt-1">
							{imagePreview ? 'Extracted colors' : 'Choose your colors'}
						</p>
					</div>

					<div class="space-y-4">
						{#each extractedColors as color, index}
							<div class="flex items-center space-x-4">
								<div class="flex-shrink-0 w-16">
									<Label class="text-sm font-medium text-gray-700 dark:text-gray-300">
										Color {index + 1}
									</Label>
								</div>
								
								<!-- Color Swatch -->
								<div 
									class="w-12 h-12 rounded-lg border-2 border-gray-200 shadow-sm flex-shrink-0"
									style="background-color: {color}"
								></div>
								
								<!-- Color Picker and Hex -->
								<div class="flex items-center space-x-3 flex-1">
									<input 
										type="color" 
										bind:value={extractedColors[index]}
										class="w-12 h-8 rounded border-2 border-gray-200 cursor-pointer"
										title="Choose color {index + 1}"
									/>
									<div class="text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
										{color.toUpperCase()}
									</div>
								</div>
							</div>
						{/each}
						
						<div class="pt-4 border-t border-gray-100 dark:border-gray-800">
							<p class="text-xs text-gray-500 text-center">
								These colors will be used throughout your brand materials
							</p>
						</div>
					</div>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Action Buttons -->
	<div class="flex gap-3 mt-8">
		<form method="POST" action="?/skip" class="flex-1">
			<Button 
				type="submit" 
				variant="outline" 
				class="w-full h-12"
				disabled={loading}
			>
				Skip for now
			</Button>
		</form>
		
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
			class="flex-1"
		>
			<Button 
				type="submit" 
				class="w-full h-12 bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700"
				disabled={loading}
			>
				{#if loading}
					<div class="flex items-center gap-2">
						<div
							class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
						></div>
						Saving...
					</div>
				{:else}
					Continue to dashboard
				{/if}
			</Button>
		</form>
	</div>

	{#snippet footer()}
		<div class="text-center">
			<p class="text-xs text-gray-500 dark:text-gray-400">
				Your logo will be used across your brand materials and can be updated anytime
			</p>
		</div>
	{/snippet}
</AuthLayout>