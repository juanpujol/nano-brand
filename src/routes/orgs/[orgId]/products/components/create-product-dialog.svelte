<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { PlusIcon, XIcon, UploadIcon, ImageIcon } from '@lucide/svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';

	interface Props {
		open: boolean;
		formAction: string;
	}

	let { open = $bindable(), formAction }: Props = $props();

	// Form state
	let name = $state('');
	let description = $state('');
	let tags = $state<string[]>([]);
	let tagInput = $state('');
	let loading = $state(false);
	let errors = $state<{[key: string]: string}>({});
	
	// Image upload state
	let files = $state<FileList>();
	let imagePreviews = $state<string[]>([]);
	let dragOver = $state(false);

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

	// Handle file selection
	function handleFileSelect(selectedFiles: FileList | undefined) {
		if (!selectedFiles || selectedFiles.length === 0) return;

		const newFiles = Array.from(selectedFiles);
		const validFiles: File[] = [];

		// Validate each file
		for (const file of newFiles) {
			// Check file type
			if (!file.type.startsWith('image/')) {
				toast.error(`"${file.name}" is not a valid image file`);
				continue;
			}

			// Check file size (5MB limit)
			if (file.size > 5 * 1024 * 1024) {
				toast.error(`"${file.name}" is too large. Maximum size is 5MB`);
				continue;
			}

			validFiles.push(file);
		}

		// Check total count limit
		const currentCount = imagePreviews.length;
		const newCount = Math.min(validFiles.length, 5 - currentCount);

		if (newCount === 0) {
			toast.error('You can only upload up to 5 images');
			return;
		}

		if (newCount < validFiles.length) {
			toast.error(`Only the first ${newCount} images will be added (maximum 5 images allowed)`);
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

	function handleCancel() {
		// Reset form
		name = '';
		description = '';
		tags = [];
		tagInput = '';
		errors = {};
		files = undefined;
		imagePreviews = [];
		dragOver = false;
		open = false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-h-[90vh] w-[90vw] max-w-lg overflow-y-auto sm:w-full sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<PlusIcon class="h-5 w-5" />
				New Product
			</Dialog.Title>
			<Dialog.Description>
				Create a new product for your brand. You can add reference images and details to help generate better content.
			</Dialog.Description>
		</Dialog.Header>

		{#if Object.keys(errors).length > 0}
			<div class="mb-4">
				<div
					class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
				>
					{#each Object.values(errors) as error}
						<p>{error}</p>
					{/each}
				</div>
			</div>
		{/if}

		<form 
			method="POST" 
			action={formAction} 
			use:enhance={() => {
				loading = true;
				errors = {};
				return async ({ result, update }) => {
					if (result.type === 'success') {
						toast.success('Product created successfully');
						handleCancel(); // This will reset form and close dialog
					} else if (result.type === 'failure') {
						const formData = result.data as { form?: { message?: string } };
						if (formData?.form?.message) {
							errors.general = formData.form.message;
						} else {
							errors.general = 'Error creating product';
						}
						toast.error(errors.general);
					}
					loading = false;
					await update();
				};
			}} 
			class="space-y-4"
		>
			<div class="space-y-2">
				<Label for="name">Product name *</Label>
				<Input
					id="name"
					name="name"
					type="text"
					placeholder="e.g. Wireless Headphones"
					bind:value={name}
					disabled={loading}
					maxlength={100}
					required
				/>
				{#if errors.name}
					<p class="text-sm text-destructive">{errors.name}</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="description">Description (optional)</Label>
				<Textarea
					id="description"
					name="description"
					placeholder="Describe your product, its features, target audience..."
					bind:value={description}
					disabled={loading}
					rows={3}
					class="min-h-[80px]"
					maxlength={500}
				/>
				{#if errors.description}
					<p class="text-sm text-destructive">{errors.description}</p>
				{/if}
				<p class="text-xs text-muted-foreground">
					A clear description helps generate better brand materials
				</p>
			</div>

			<!-- Tags Input -->
			<div class="space-y-2">
				<Label>Tags (optional)</Label>
				<div class="space-y-2">
					<Input
						type="text"
						placeholder="Add tags (press Enter or comma to add)"
						bind:value={tagInput}
						onkeydown={handleTagInput}
						disabled={loading || tags.length >= 10}
						maxlength={50}
					/>
					
					{#if tags.length > 0}
						<div class="flex flex-wrap gap-2">
							{#each tags as tag (tag)}
								<Badge variant="secondary" class="flex items-center gap-1">
									{tag}
									<button
										type="button"
										onclick={() => removeTag(tag)}
										disabled={loading}
										class="ml-1 hover:text-destructive"
									>
										<XIcon class="h-3 w-3" />
									</button>
								</Badge>
							{/each}
						</div>
					{/if}
					
					<p class="text-xs text-muted-foreground">
						{tags.length}/10 tags • Use tags to categorize your products
					</p>
				</div>
			</div>

			<!-- Reference Images Upload -->
			<div class="space-y-2">
				<Label>Reference Images (optional)</Label>
				<div class="space-y-2">
					<!-- Upload Area -->
					<div
						role="button"
						tabindex="0"
						class="relative border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center transition-colors
							{dragOver ? 'border-primary bg-primary/5' : ''}
							{imagePreviews.length >= 5 ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50 cursor-pointer'}"
						ondragover={handleDragOver}
						ondragleave={handleDragLeave}
						ondrop={handleDrop}
						onclick={() => {
							if (imagePreviews.length < 5) {
								const input = document.createElement('input');
								input.type = 'file';
								input.accept = 'image/*';
								input.multiple = true;
								input.onchange = (e) => {
									const target = e.target as HTMLInputElement;
									handleFileSelect(target.files || undefined);
								};
								input.click();
							}
						}}
						onkeydown={(e) => {
							if ((e.key === 'Enter' || e.key === ' ') && imagePreviews.length < 5) {
								e.preventDefault();
								const input = document.createElement('input');
								input.type = 'file';
								input.accept = 'image/*';
								input.multiple = true;
								input.onchange = (e) => {
									const target = e.target as HTMLInputElement;
									handleFileSelect(target.files || undefined);
								};
								input.click();
							}
						}}
					>
						{#if imagePreviews.length === 0}
							<div class="flex flex-col items-center gap-2">
								<UploadIcon class="h-10 w-10 text-muted-foreground" />
								<div>
									<p class="text-sm font-medium">Upload reference images</p>
									<p class="text-xs text-muted-foreground">
										Drag and drop or click to browse • Up to 5 images • Max 5MB each
									</p>
								</div>
							</div>
						{:else}
							<div class="flex flex-col items-center gap-2">
								<ImageIcon class="h-8 w-8 text-muted-foreground" />
								<p class="text-sm">
									{imagePreviews.length < 5 ? 'Add more images' : 'Maximum images reached'}
								</p>
							</div>
						{/if}
					</div>

					<!-- Image Previews -->
					{#if imagePreviews.length > 0}
						<div class="grid grid-cols-3 gap-2">
							{#each imagePreviews as preview, index}
								<div class="relative group aspect-square">
									<img
										src={preview}
										alt="Preview {index + 1}"
										class="w-full h-full object-cover rounded-md border"
									/>
									<button
										type="button"
										onclick={() => removeImage(index)}
										disabled={loading}
										class="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
									>
										<XIcon class="h-3 w-3" />
									</button>
								</div>
							{/each}
						</div>
					{/if}
					
					<p class="text-xs text-muted-foreground">
						{imagePreviews.length}/5 images • Reference images help generate better brand materials
					</p>
				</div>

				<!-- Hidden file input for form submission -->
				<input
					type="file"
					name="referenceImages"
					bind:files
					multiple
					accept="image/*"
					class="hidden"
				/>
			</div>

			<!-- Hidden input for tags -->
			{#each tags as tag}
				<input type="hidden" name="tags" value={tag} />
			{/each}

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
				<Button type="submit" class="flex-1" disabled={loading || !name.trim()}>
					{#if loading}
						<div class="flex items-center gap-2">
							<div class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
							Creating...
						</div>
					{:else}
						<PlusIcon class="mr-2 h-4 w-4" />
						Create Product
					{/if}
				</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>