<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import {
		PackageIcon,
		SearchIcon,
		PlusIcon,
		ChevronLeftIcon,
		ChevronRightIcon
	} from '@lucide/svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { PUBLIC_STORAGE_URL } from '$env/static/public';
	import type { PageData } from './$types';
	import CreateProductDialog from './components/create-product-dialog.svelte';

	let { data }: { data: PageData } = $props();

	// Search state
	let searchTerm = $state(page.url.searchParams.get('search') || '');
	let searchTimeout: ReturnType<typeof setTimeout>;

	// Dialog state
	let isCreateDialogOpen = $state(false);

	// Search function with debounce
	function handleSearch() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			const url = new URL(page.url);
			if (searchTerm.trim()) {
				url.searchParams.set('search', searchTerm.trim());
			} else {
				url.searchParams.delete('search');
			}
			url.searchParams.set('page', '1'); // Reset to first page on search
			goto(url.toString(), {
				keepFocus: true,
				noScroll: true
			});
		}, 500); // 500ms debounce
	}

	// Handle navigation for pagination
	function handlePageChange(newPage: number) {
		const url = new URL(page.url);
		url.searchParams.set('page', String(newPage));
		goto(url.toString(), {
			keepFocus: true,
			noScroll: true
		});
	}

	// Handle creating new product
	function handleCreateProduct() {
		isCreateDialogOpen = true;
	}

	const totalPages = $derived(data.totalPages || 1);
	const canPreviousPage = $derived((data.page || 1) > 1);
	const canNextPage = $derived((data.page || 1) < (data.totalPages || 1));
	const currentPage = $derived(data.page || 1);
</script>

<svelte:head>
	<title>Products | NanoBrand</title>
</svelte:head>

<div class="mx-auto w-full max-w-6xl space-y-6 p-6">
	<!-- Page Header -->
	<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
		<div>
			<h1 class="text-3xl font-semibold tracking-tight">Products</h1>
			<p class="text-muted-foreground">
				{data.total} product{data.total !== 1 ? 's' : ''} found
			</p>
		</div>
		<div class="flex flex-col gap-2 md:flex-row md:items-center">
			<div class="relative">
				<SearchIcon
					class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
				/>
				<Input
					type="text"
					placeholder="Search products..."
					bind:value={searchTerm}
					oninput={handleSearch}
					class="w-full pl-9 md:w-64"
				/>
			</div>
			<div>
				<Button onclick={handleCreateProduct} class="shrink-0">
					<PlusIcon class="mr-2 h-4 w-4" />
					New product
				</Button>
			</div>
		</div>
	</div>

	<!-- Products Grid -->
	{#if data.products && data.products.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
			{#each data.products as product (product.id)}
				<Card.Root class="group overflow-hidden transition-shadow hover:shadow-lg py-0 gap-0">
					<a 
						href="/orgs/{page.params.orgId}/products/{product.id}/gallery" 
						class="block"
						aria-label="View {product.name} gallery"
					>
						<div class="aspect-square relative overflow-hidden bg-muted">
							{#if product.reference_images && product.reference_images.length > 0}
								<img
									src={`${PUBLIC_STORAGE_URL}/${product.reference_images[0]}`}
									alt={product.name}
									class="w-full h-full object-cover transition-transform group-hover:scale-105"
								/>
							{:else}
								<div class="flex items-center justify-center h-full">
									<PackageIcon class="h-12 w-12 text-muted-foreground" />
								</div>
							{/if}
						</div>
					</a>
					<Card.Content class="p-4">
						<h3 class="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
						{#if product.description}
							<p class="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
						{/if}
						{#if product.tags && product.tags.length > 0}
							<div class="flex flex-wrap gap-1 mb-3">
								{#each product.tags.slice(0, 3) as tag (tag)}
									<Badge variant="secondary" class="text-xs">{tag}</Badge>
								{/each}
								{#if product.tags.length > 3}
									<Badge variant="outline" class="text-xs">+{product.tags.length - 3}</Badge>
								{/if}
							</div>
						{/if}
						<div class="flex items-center justify-between text-xs text-muted-foreground">
							<span>Created {new Date(product.created_at).toLocaleDateString()}</span>
							{#if product.reference_images && product.reference_images.length > 1}
								<span>{product.reference_images.length} images</span>
							{/if}
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<div class="text-center text-sm text-muted-foreground md:text-left">
					Page {currentPage} of {totalPages} • {data.total} product{data.total !== 1 ? 's' : ''} total
				</div>
				<div class="flex items-center justify-center space-x-2 md:justify-end">
					<Button
						variant="outline"
						size="sm"
						onclick={() => handlePageChange(currentPage - 1)}
						disabled={!canPreviousPage}
						class="flex-shrink-0"
					>
						<ChevronLeftIcon class="h-4 w-4" />
						<span class="hidden sm:inline">Previous</span>
					</Button>
					<div class="flex items-center space-x-1 text-sm">
						<span class="hidden sm:inline">Page</span>
						<span class="font-medium">{currentPage}</span>
						<span>of</span>
						<span class="font-medium">{totalPages}</span>
					</div>
					<Button
						variant="outline"
						size="sm"
						onclick={() => handlePageChange(currentPage + 1)}
						disabled={!canNextPage}
						class="flex-shrink-0"
					>
						<span class="hidden sm:inline">Next</span>
						<ChevronRightIcon class="h-4 w-4" />
					</Button>
				</div>
			</div>
		{/if}
	{:else}
		<!-- Empty State -->
		<Card.Root class="py-12 text-center">
			<Card.Content>
				<div class="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
					<PackageIcon class="h-12 w-12 text-muted-foreground" />
				</div>
				<h3 class="mb-2 text-lg font-semibold">No products found</h3>
				<p class="mx-auto mb-6 max-w-md text-muted-foreground">
					{#if searchTerm}
						No products found for "{searchTerm}". Try adjusting your search.
					{:else}
						Create your first product to start generating brand materials and content.
					{/if}
				</p>
				{#if !searchTerm}
					<Button onclick={handleCreateProduct}>
						<PlusIcon class="mr-2 h-4 w-4" />
						Create first product
					</Button>
				{/if}
			</Card.Content>
		</Card.Root>
	{/if}
</div>

<!-- Create Product Dialog -->
<CreateProductDialog
	bind:open={isCreateDialogOpen}
	formAction="?/create"
/>