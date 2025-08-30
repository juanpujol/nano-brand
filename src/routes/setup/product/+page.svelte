<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Badge } from '$lib/components/ui/badge';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import { enhance } from '$app/forms';
	import { UploadIcon, XIcon, PackageIcon } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let productName = $state('');
	let description = $state('');
	let tagInput = $state('');
	let tags = $state<string[]>([]);
	let files = $state<FileList>();
	let imagePreviews = $state<string[]>([]);
	let loading = $state(false);
	let dragOver = $state(false);

	// Handle file selection
	function handleFileSelect(selectedFiles: FileList | undefined) {
		if (!selectedFiles || selectedFiles.length === 0) return;

		const newFiles = Array.from(selectedFiles);
		const validFiles: File[] = [];

		// Validate each file
		for (const file of newFiles) {
			// Check file type
			if (!file.type.startsWith('image/')) {
				alert(`"${file.name}" is not a valid image file`);
				continue;
			}

			// Check file size (5MB limit)
			if (file.size > 5 * 1024 * 1024) {
				alert(`"${file.name}" is too large. Maximum size is 5MB`);
				continue;
			}

			validFiles.push(file);
		}

		// Check total count limit
		const currentCount = imagePreviews.length;
		const newCount = Math.min(validFiles.length, 6 - currentCount);

		if (newCount === 0) {
			alert('You can only upload up to 6 images');
			return;
		}

		if (newCount < validFiles.length) {
			alert(`Only the first ${newCount} images will be added (maximum 6 images allowed)`);
		}

		// Process valid files
		const filesToAdd = validFiles.slice(0, newCount);

		// Create new FileList with existing and new files
		const existingFiles = files ? Array.from(files) : [];
		const allFiles = [...existingFiles, ...filesToAdd];

		const dataTransfer = new DataTransfer();
		allFiles.forEach(file => dataTransfer.items.add(file));
		files = dataTransfer.files;

		// Create previews for new files
		filesToAdd.forEach(file => {
			const reader = new FileReader();
			reader.onload = (e) => {
				if (e.target?.result) {
					imagePreviews = [...imagePreviews, e.target.result as string];
				}
			};
			reader.readAsDataURL(file);
		});
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

	// Remove image at specific index
	function removeImage(index: number) {
		if (!files) return;

		const fileArray = Array.from(files);
		fileArray.splice(index, 1);

		const dataTransfer = new DataTransfer();
		fileArray.forEach(file => dataTransfer.items.add(file));
		files = dataTransfer.files;

		imagePreviews = imagePreviews.filter((_, i) => i !== index);
	}

	// Handle tag input
	function handleTagInput(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			addTag();
		}
	}

	function addTag() {
		const input = tagInput.trim();
		if (!input) return;

		// Split by commas and process each tag
		const newTags = input
			.split(',')
			.map(tag => tag.trim().toLowerCase())
			.filter(tag => tag && !tags.includes(tag));

		// Add new tags up to the limit of 10 total
		const remainingSlots = 10 - tags.length;
		const tagsToAdd = newTags.slice(0, remainingSlots);

		if (tagsToAdd.length > 0) {
			tags = [...tags, ...tagsToAdd];
		}

		tagInput = '';
	}

	function removeTag(tagToRemove: string) {
		tags = tags.filter(tag => tag !== tagToRemove);
	}
</script>

<svelte:head>
	<title>Create First Product | NanoBrand</title>
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
						<div class="mx-auto w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-orange-600 flex items-center justify-center">
							<PackageIcon class="h-7 w-7 text-white" />
						</div>
						<h1 class="text-2xl font-bold" data-testid="product-setup-title">
							Create your first product
						</h1>
						<p class="text-muted-foreground text-balance text-sm">
							Add a product to get started with brand materials generation
						</p>
					</div>

					<Card.Root>
						<Card.Content class="px-6">
							<div class="grid gap-6">
								<div class="grid gap-3">
									<Label for="productName">Product name *</Label>
									<Input
										id="productName"
										name="productName"
										type="text"
										placeholder="My Product"
										bind:value={productName}
										required
										disabled={loading}
										maxlength={100}
										data-testid="product-name-input"
									/>
									<p class="text-xs text-muted-foreground">
										A clear, descriptive name for your product
									</p>
								</div>

								<div class="grid gap-3">
									<Label for="description">Description</Label>
									<Textarea
										id="description"
										name="description"
										placeholder="Describe your product, its features, and target audience..."
										bind:value={description}
										class="resize-none"
										disabled={loading}
										maxlength={500}
										rows={3}
									/>
									<p class="text-xs text-muted-foreground">
										{description.length}/500 characters
									</p>
								</div>

								<div class="grid gap-3">
									<Label for="tags">Tags</Label>
									<Input
										id="tags"
										type="text"
										placeholder="Add tags (press Enter or comma to add)"
										bind:value={tagInput}
										disabled={loading}
										onkeydown={handleTagInput}
										onblur={addTag}
									/>
									{#if tags.length > 0}
										<div class="flex flex-wrap gap-2">
											{#each tags as tag (tag)}
												<Badge
													variant="secondary"
													class="flex items-center gap-1"
												>
													<span class="break-all">{tag}</span>
													<button
														type="button"
														onclick={() => removeTag(tag)}
														class="hover:text-destructive"
														disabled={loading}
													>
														<XIcon class="h-3 w-3" />
													</button>
												</Badge>
											{/each}
										</div>
									{/if}
									<p class="text-xs text-muted-foreground">
										Add relevant tags to help categorize your product (max 10)
									</p>
								</div>

								<div class="grid gap-3">
									<Label>Reference images *</Label>
									<p class="text-xs text-muted-foreground">
										Upload 1-6 reference images to help generate better brand materials
									</p>

									{#if imagePreviews.length === 0}
										<div
											class="border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer {dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}"
											role="button"
											tabindex="0"
											onclick={() => document.getElementById('image-upload')?.click()}
											onkeydown={(e) => e.key === 'Enter' && document.getElementById('image-upload')?.click()}
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
														Drag and drop images
													</p>
													<p class="text-sm text-muted-foreground">
														or click to browse files
													</p>
												</div>
												<div class="text-xs text-muted-foreground">
													PNG, JPG, JPEG • Max 5MB per image • Up to 6 images
												</div>
											</div>
										</div>
									{:else}
										<div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
											{#each imagePreviews as preview, index (index)}
												<div class="relative group">
													<img
														src={preview}
														alt="Product reference {index + 1}"
														class="w-full aspect-square object-cover rounded-lg border"
													/>
													<button
														type="button"
														onclick={() => removeImage(index)}
														class="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
														disabled={loading}
													>
														<XIcon class="h-4 w-4" />
													</button>
												</div>
											{/each}

											{#if imagePreviews.length < 6}
												<div
													class="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
													role="button"
													tabindex="0"
													onclick={() => document.getElementById('image-upload')?.click()}
													onkeydown={(e) => e.key === 'Enter' && document.getElementById('image-upload')?.click()}
												>
													<UploadIcon class="h-8 w-8 text-muted-foreground" />
												</div>
											{/if}
										</div>
									{/if}

									<Input
										id="image-upload"
										type="file"
										accept="image/*"
										multiple
										bind:files
										onchange={() => handleFileSelect(files)}
										class="hidden"
									/>
								</div>
							</div>
						</Card.Content>
					</Card.Root>

					<!-- Action Buttons -->
					<div class="flex gap-3 justify-between">
						<form method="POST" action="?/skip">
							<input type="hidden" name="orgId" value={data.orgId} />
							<Button
								type="submit"
								variant="outline"
								disabled={loading}
								data-testid="skip-button"
							>
								Skip for now
							</Button>
						</form>

						<form
							method="POST"
							action="?/continue"
							enctype="multipart/form-data"
							use:enhance={() => {
								loading = true;
								return async ({ update }) => {
									await update();
									loading = false;
								};
							}}
						>
							<input type="hidden" name="orgId" value={data.orgId} />
							<input type="hidden" name="productName" value={productName} />
							<input type="hidden" name="description" value={description} />
							{#each tags as tag (tag)}
								<input type="hidden" name="tags" value={tag} />
							{/each}

							<!-- File inputs will be bound automatically -->
							{#if files && files.length > 0}
								{#each Array.from(files) as _file, index (index)}
									<input type="file" name="referenceImages" bind:files class="hidden" />
								{/each}
							{/if}

							<Button
								type="submit"
								disabled={loading || !productName.trim() || imagePreviews.length === 0}
								data-testid="continue-button"
							>
								{#if loading}
									<div class="flex items-center gap-2">
										<div class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
										Creating product...
									</div>
								{:else}
									Continue to dashboard
								{/if}
							</Button>
						</form>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>