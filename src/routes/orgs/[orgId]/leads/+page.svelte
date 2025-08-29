<script lang="ts">
	import { type ColumnDef, getCoreRowModel, getPaginationRowModel } from '@tanstack/table-core';
	import { createSvelteTable, FlexRender, renderComponent } from '$lib/components/ui/data-table';
	import * as Table from '$lib/components/ui/table';
	import * as Card from '$lib/components/ui/card';
	import FitScoreBadge from '$lib/components/fit-score-badge.svelte';
	import LeadDetailSheet from '$lib/components/lead-detail-sheet.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from '@lucide/svelte';
	import type { Lead } from '$lib/types/leads';
	import type { PageData } from './$types';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	// Organization data from parent layout
	const orgData = $derived(page.data);

	// Search state
	let searchTerm = $state(page.url.searchParams.get('search') || '');
	let searchTimeout: ReturnType<typeof setTimeout>;

	// Lead detail sheet state
	let selectedLead = $state<Lead | null>(null);
	let isSheetOpen = $state(false);

	function openLeadDetail(lead: Lead) {
		selectedLead = lead;
		isSheetOpen = true;
	}

	function closeLeadDetail() {
		isSheetOpen = false;
		selectedLead = null;
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

	// Define columns for the leads table
	const columns: ColumnDef<Lead>[] = [
		{
			accessorKey: 'name',
			header: 'Nome',
			cell: (info) => info.getValue() || '-'
		},
		{
			accessorKey: 'email',
			header: 'Email',
			cell: (info) => info.getValue() || '-'
		},
		{
			accessorKey: 'company',
			header: 'Empresa',
			cell: (info) => info.getValue() || '-'
		},
		{
			accessorKey: 'job_title',
			header: 'Cargo',
			cell: (info) => info.getValue() || '-'
		},
		{
			accessorKey: 'fit_score',
			header: 'Fit',
			cell: ({ row }) => {
				return renderComponent(FitScoreBadge, {
					fitScore: row.original.fit_score
				});
			}
		},
		{
			accessorKey: 'interest',
			header: 'Interesse',
			cell: (info) => info.getValue() || '0',
			meta: { align: 'right' }
		},
		{
			accessorKey: 'total_conversions',
			header: 'Conversões',
			cell: (info) => info.getValue() || '0',
			meta: { align: 'right' }
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
			data: data.leads,
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
	<title>Leads | {orgData.currentOrganization?.name || 'Organização'} | Laiki</title>
</svelte:head>

<div class="mx-auto w-full max-w-7xl space-y-6 p-6">
	<!-- Page Header -->
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div>
			<h1 class="text-3xl font-semibold tracking-tight">Leads</h1>
			<p class="text-muted-foreground">
				{data.total} leads encontrados
			</p>
		</div>
		<div class="flex items-center space-x-2">
			<div class="relative">
				<SearchIcon
					class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
				/>
				<Input
					type="text"
					placeholder="Buscar por nome ou email..."
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
		<div class="overflow-auto md:max-w-[calc(100vw-var(--sidebar-width)-4rem)]" id="leads-table">
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
							onclick={() => openLeadDetail(row.original)}
						>
							{#each row.getVisibleCells() as cell (cell.id)}
								<Table.Cell class="px-4 py-3 text-sm">
									<div
										class="{cell.column.id === 'name' ||
										cell.column.id === 'email' ||
										cell.column.id === 'company' ||
										cell.column.id === 'job_title'
											? 'max-w-[200px]'
											: 'max-w-[150px]'} {cell.column.id === 'name' ||
										cell.column.id === 'fit_score'
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
								Nenhum lead encontrado.
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
						Página {currentPage} de {totalPages} • {data.total} leads no total
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

<!-- Lead Detail Sheet -->
<LeadDetailSheet lead={selectedLead} open={isSheetOpen} onOpenChange={closeLeadDetail} />
