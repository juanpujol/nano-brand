<script lang="ts">
	import { type ColumnDef, getCoreRowModel, getPaginationRowModel } from '@tanstack/table-core';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table';
	import * as Table from '$lib/components/ui/table';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from '@lucide/svelte';
	import type { Conversion } from '$lib/types/conversions';
	import type { PageData } from './$types';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import ConversionDetailSheet from '$lib/components/conversion-detail-sheet.svelte';

	let { data }: { data: PageData } = $props();

	// Organization data from parent layout
	const orgData = $derived(page.data);

	// Search state
	let searchTerm = $state(page.url.searchParams.get('search') || '');
	let searchTimeout: ReturnType<typeof setTimeout>;

	// Conversion detail sheet state
	let selectedConversion = $state<Conversion | null>(null);
	let isSheetOpen = $state(false);

	function openConversionDetail(conversion: Conversion) {
		selectedConversion = conversion;
		isSheetOpen = true;
	}

	function closeConversionDetail() {
		isSheetOpen = false;
		selectedConversion = null;
	}

	// Format date helper
	function formatDate(dateString: string): string {
		try {
			const date = new Date(dateString);
			return date.toLocaleDateString('pt-BR', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return dateString;
		}
	}

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

	// Define columns for the conversions table
	const columns: ColumnDef<Conversion>[] = [
		{
			accessorKey: 'name',
			header: 'Conversão'
		},
		{
			accessorKey: 'date',
			header: 'Data',
			cell: (info) => formatDate(info.getValue() as string)
		},
		{
			accessorKey: 'value',
			header: 'Valor',
			cell: (info) => {
				const value = info.getValue() as number | null;
				if (!value) return '-';
				return `R$ ${value.toLocaleString('pt-BR')}`;
			},
			meta: { align: 'right' }
		},
		{
			accessorKey: 'utm_source',
			header: 'Origem',
			cell: (info) => info.getValue() || '-'
		},
		{
			accessorKey: 'utm_medium',
			header: 'Mídia',
			cell: (info) => info.getValue() || '-'
		},
		{
			accessorKey: 'utm_campaign',
			header: 'Campanha',
			cell: (info) => info.getValue() || '-'
		},
		{
			accessorKey: 'utm_content',
			header: 'Conteúdo',
			cell: (info) => info.getValue() || '-'
		},
		{
			accessorKey: 'utm_term',
			header: 'KW',
			cell: (info) => info.getValue() || '-'
		},
		{
			id: 'lead_name',
			header: 'Lead',
			accessorFn: (row) => row.leads?.name || '-',
			cell: (info) => info.getValue() || '-',
			size: 200
		}
	];

	// Local pagination state for table UI
	const pagination = $derived({
		pageIndex: data.page - 1,
		pageSize: data.pageSize
	});

	// Create table
	const table = $derived(
		createSvelteTable({
			data: data.conversions,
			columns,
			getCoreRowModel: getCoreRowModel(),
			getPaginationRowModel: getPaginationRowModel(),
			manualPagination: true,
			pageCount: data.totalPages,
			state: {
				get pagination() {
					return pagination;
				}
			},
			onPaginationChange: (updater) => {
				const currentPagination = {
					pageIndex: data.page - 1,
					pageSize: data.pageSize
				};
				const newPagination = typeof updater === 'function' ? updater(currentPagination) : updater;

				// Navigate to new page
				const url = new URL(page.url);
				url.searchParams.set('page', String(newPagination.pageIndex + 1));
				url.searchParams.set('pageSize', String(newPagination.pageSize));
				goto(url.toString(), {
					keepFocus: true,
					noScroll: true
				});
			}
		})
	);

	const totalPages = $derived(data.totalPages);
	const canPreviousPage = $derived(data.page > 1);
	const canNextPage = $derived(data.page < data.totalPages);
	const currentPage = $derived(data.page);
</script>

<svelte:head>
	<title>Conversões | {orgData.currentOrganization?.name || 'Organização'} | Laiki</title>
</svelte:head>

<div class="mx-auto w-full max-w-7xl space-y-6 p-6">
	<!-- Page Header -->
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div>
			<h1 class="text-3xl font-semibold tracking-tight">Conversões</h1>
			<p class="text-muted-foreground">
				{data.total} conversões encontradas
			</p>
		</div>
		<div class="flex items-center space-x-2">
			<div class="relative">
				<SearchIcon
					class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
				/>
				<Input
					type="text"
					placeholder="Buscar por conversão..."
					bind:value={searchTerm}
					oninput={handleSearch}
					class="w-full pl-9 md:w-64"
				/>
			</div>
		</div>
	</div>

	<!-- Data Table Card -->
	<Card.Root class="flex w-full flex-col gap-0 overflow-hidden py-0">
		<!-- Table Content -->
		<div
			class="overflow-auto md:max-w-[calc(100vw-var(--sidebar-width)-4rem)]"
			id="conversions-table"
		>
			<Table.Root>
				<Table.Header>
					{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
						<Table.Row>
							{#each headerGroup.headers as header (header.id)}
								<Table.Head
									class="px-4 py-3 text-sm font-medium {header.column.columnDef.meta?.align ===
									'right'
										? 'text-right'
										: ''}"
								>
									{#if !header.isPlaceholder}
										<FlexRender
											content={header.column.columnDef.header}
											context={header.getContext()}
										/>
									{/if}
								</Table.Head>
							{/each}
						</Table.Row>
					{/each}
				</Table.Header>
				<Table.Body>
					{#each table.getRowModel().rows as row (row.id)}
						<Table.Row
							class="cursor-pointer hover:bg-muted/50"
							onclick={() => openConversionDetail(row.original)}
						>
							{#each row.getVisibleCells() as cell (cell.id)}
								<Table.Cell class="px-4 py-3 text-sm">
									<div
										class="{cell.column.id === 'lead_name'
											? 'max-w-[200px]'
											: cell.column.id === 'name'
												? 'max-w-[200px]'
												: 'max-w-[150px]'} {cell.column.id === 'name' ||
										cell.column.id === 'lead_name'
											? ''
											: 'text-muted-foreground'} {cell.column.columnDef.meta?.align === 'right'
											? 'text-right'
											: ''} truncate"
										title={String(cell.getValue())}
									>
										<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
									</div>
								</Table.Cell>
							{/each}
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell
								colspan={columns.length}
								class="h-24 text-center text-xs text-muted-foreground"
							>
								Nenhuma conversão encontrada.
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="border-t px-6 py-4">
				<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<div class="text-center text-sm text-muted-foreground md:text-left">
						Página {currentPage} de {totalPages} • {data.total} conversões no total
					</div>
					<div class="flex items-center justify-center space-x-2 md:justify-end">
						<Button
							variant="outline"
							size="sm"
							onclick={() => table.previousPage()}
							disabled={!canPreviousPage}
							class="flex-shrink-0"
						>
							<ChevronLeftIcon class="h-4 w-4" />
							<span class="hidden sm:inline">Anterior</span>
						</Button>
						<div class="flex items-center space-x-1 text-sm">
							<span class="hidden sm:inline">Página</span>
							<span class="font-medium">{currentPage}</span>
							<span>de</span>
							<span class="font-medium">{totalPages}</span>
						</div>
						<Button
							variant="outline"
							size="sm"
							onclick={() => table.nextPage()}
							disabled={!canNextPage}
							class="flex-shrink-0"
						>
							<span class="hidden sm:inline">Próxima</span>
							<ChevronRightIcon class="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
		{/if}
	</Card.Root>
</div>

<!-- Conversion Detail Sheet -->
<ConversionDetailSheet
	conversion={selectedConversion}
	open={isSheetOpen}
	onOpenChange={closeConversionDetail}
/>
