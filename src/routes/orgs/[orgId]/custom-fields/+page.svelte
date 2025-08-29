<script lang="ts">
	import { type ColumnDef, getCoreRowModel, getPaginationRowModel } from '@tanstack/table-core';
	import { createSvelteTable, FlexRender, renderComponent } from '$lib/components/ui/data-table';
	import * as Table from '$lib/components/ui/table';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { ChevronLeft, ChevronRight, Search, Plus } from '@lucide/svelte';
	import type { LeadsCustomFieldDefinition } from '$lib/schemas/custom-fields';
	import type { PageData } from './$types';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import CustomFieldDialog from '$lib/components/custom-field-dialog.svelte';
	import RequiredBadge from '$lib/components/required-badge.svelte';
	import { DTWrapperCell, DTCodCell } from '$lib/components/ui/data-table-cells';

	let { data }: { data: PageData } = $props();

	// Organization data from parent layout
	const orgData = $derived(page.data);

	// Search state
	let searchTerm = $state(page.url.searchParams.get('search') || '');
	let searchTimeout: ReturnType<typeof setTimeout>;

	// Dialog state
	let selectedField = $state<LeadsCustomFieldDefinition | null>(null);
	let isDialogOpen = $state(false);
	let dialogMode = $state<'create' | 'update'>('create');

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

	// Handle opening dialogs
	function openCreateDialog() {
		dialogMode = 'create';
		selectedField = null;
		isDialogOpen = true;
	}

	function openUpdateDialog(field: LeadsCustomFieldDefinition) {
		dialogMode = 'update';
		selectedField = field;
		isDialogOpen = true;
	}

	// Define columns for the custom fields table
	const columns: ColumnDef<LeadsCustomFieldDefinition>[] = [
		{
			accessorKey: 'label',
			header: 'Título',
			cell: ({ row }) =>
				renderComponent(DTWrapperCell, {
					value: row.original.label,
					class: 'text-foreground'
				}),
			size: 200
		},
		{
			accessorKey: 'field_key',
			header: 'Chave',
			cell: ({ row }) =>
				renderComponent(DTCodCell, {
					value: row.original.field_key
				}),
			size: 200
		},
		{
			accessorKey: 'description',
			header: 'Descrição',
			cell: ({ row }) => row.original.description || '-',
			size: 300
		},
		{
			accessorKey: 'type',
			header: 'Tipo',
			cell: ({ row }) =>
				renderComponent(DTCodCell, {
					value: row.original.type
				}),
			size: 100
		},
		{
			accessorKey: 'is_required',
			header: 'Obrigatório',
			cell: ({ row }) => {
				return renderComponent(RequiredBadge, {
					isRequired: row.original.is_required
				});
			},
			size: 120
		},
		{
			accessorKey: 'usage_count',
			header: () =>
				renderComponent(DTWrapperCell, {
					value: 'Uso',
					class: 'text-right'
				}),
			cell: ({ row }) =>
				renderComponent(DTWrapperCell, {
					value: `${row.original.usage_count} lead${row.original.usage_count !== 1 ? 's' : ''}`,
					class: 'text-foreground text-right'
				}),
			size: 100
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
			data: data.customFields,
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
	<title>
		Campos personalizados | {orgData.currentOrganization?.name || 'Organização'} | Laiki
	</title>
</svelte:head>

<div class="mx-auto w-full max-w-7xl space-y-6 p-6">
	<!-- Page Header -->
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div>
			<h1 class="text-3xl font-semibold tracking-tight">Campos personalizados</h1>
			<p class="text-muted-foreground">
				{data.total} campos encontrados
			</p>
		</div>
		<div class="flex items-center space-x-2">
			<div class="relative">
				<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="text"
					placeholder="Buscar por chave ou título..."
					bind:value={searchTerm}
					oninput={handleSearch}
					class="w-full pl-9 md:w-64"
				/>
			</div>
			<Button onclick={openCreateDialog} class="shrink-0">
				<Plus class="mr-2 h-4 w-4" />
				Novo Campo
			</Button>
		</div>
	</div>

	<!-- Data Table Card -->
	<Card.Root class="flex w-full flex-col gap-0 overflow-hidden py-0">
		<!-- Table Content -->
		<div
			class="overflow-auto md:max-w-[calc(100vw-var(--sidebar-width)-4rem)]"
			id="custom-fields-table"
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
							onclick={() => openUpdateDialog(row.original)}
						>
							{#each row.getVisibleCells() as cell (cell.id)}
								<Table.Cell class="px-4 py-3 text-sm text-muted-foreground">
									<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
								</Table.Cell>
							{/each}
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell
								colspan={columns.length}
								class="h-24 text-center text-xs text-muted-foreground"
							>
								Nenhum campo personalizado encontrado.
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
						Página {currentPage} de {totalPages} • {data.total} campos no total
					</div>
					<div class="flex items-center justify-center space-x-2 md:justify-end">
						<Button
							variant="outline"
							size="sm"
							onclick={() => table.previousPage()}
							disabled={!canPreviousPage}
							class="flex-shrink-0"
						>
							<ChevronLeft class="h-4 w-4" />
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
							<ChevronRight class="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
		{/if}
	</Card.Root>
</div>

<!-- Custom Field Dialog -->
<CustomFieldDialog
	bind:open={isDialogOpen}
	mode={dialogMode}
	customField={selectedField}
	organizationId={orgData.currentOrganization?.id}
/>
