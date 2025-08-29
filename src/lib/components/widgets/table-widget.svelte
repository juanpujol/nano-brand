<script lang="ts">
	import {
		type ColumnDef,
		type PaginationState,
		getCoreRowModel,
		getPaginationRowModel
	} from '@tanstack/table-core';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table';
	import * as Table from '$lib/components/ui/table';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { ChevronLeftIcon, ChevronRightIcon } from '@lucide/svelte';
	import type { TableWidgetProps } from '$lib/types/dashboard';

	type Props = TableWidgetProps;

	let {
		title = 'Data Table',
		description,
		data = [],
		pageSize = 10,
		showPagination = true
	}: Props = $props();

	// Pagination state
	let pagination = $state<PaginationState>({
		pageIndex: 0,
		pageSize: pageSize
	});

	// Generate columns dynamically from data structure
	const columns = $derived.by(() => {
		if (!data || data.length === 0) return [];

		// Get all unique keys from the data
		const allKeys: string[] = [];
		data.forEach((row) => {
			Object.keys(row).forEach((key) => {
				if (!allKeys.includes(key)) {
					allKeys.push(key);
				}
			});
		});

		return allKeys.map((key): ColumnDef<Record<string, unknown>> => {
			// Determine column header - capitalize first letter
			const header = key.charAt(0).toUpperCase() + key.slice(1);

			// Basic column definition
			const columnDef: ColumnDef<Record<string, unknown>> = {
				accessorKey: key,
				header
			};

			// Add special formatting based on data type and key name
			if (data.length > 0) {
				const row = data[0] as Record<string, unknown>;
				const sampleValue = row[key];

				// Currency formatting for amount-like fields
				if (
					(key === 'amount' || key === 'valor' || key === 'price') &&
					typeof sampleValue === 'number'
				) {
					columnDef.cell = (info) => {
						const value = info.getValue() as number;
						return new Intl.NumberFormat('pt-BR', {
							style: 'currency',
							currency: 'BRL'
						}).format(value);
					};
				}
				// Date formatting for date-like fields
				else if (
					(key === 'date' || key === 'data' || key.includes('Date') || key.includes('_at')) &&
					typeof sampleValue === 'string'
				) {
					columnDef.cell = (info) => {
						const dateValue = info.getValue() as string;
						try {
							const date = new Date(dateValue);
							return date.toLocaleDateString('pt-BR');
						} catch {
							return dateValue;
						}
					};
				}
				// Status formatting with badges
				else if (key === 'status' && typeof sampleValue === 'string') {
					columnDef.cell = (info) => {
						return info.getValue() as string;
					};
				}
			}

			return columnDef;
		});
	});

	// Create reactive table that updates when data or columns change
	const table = $derived(
		createSvelteTable<Record<string, unknown>>({
			data,
			columns,
			getCoreRowModel: getCoreRowModel(),
			getPaginationRowModel: getPaginationRowModel(),
			state: {
				get pagination() {
					return pagination;
				}
			},
			onPaginationChange: (updater) => {
				pagination = typeof updater === 'function' ? updater(pagination) : updater;
			}
		})
	);

	// Calculate responsive page size based on widget height
	// Use the provided page size directly - container queries handle responsive behavior
	const responsivePageSize = $derived(() => pageSize);

	// Update pagination when page size changes
	$effect(() => {
		const newPageSize = responsivePageSize();
		if (pagination.pageSize !== newPageSize) {
			pagination = { ...pagination, pageSize: newPageSize };
		}
	});

	const totalPages = $derived(table.getPageCount());
	const canPreviousPage = $derived(table.getCanPreviousPage());
	const canNextPage = $derived(table.getCanNextPage());
	const currentPage = $derived(pagination.pageIndex);
</script>

<Card.Root class="flex h-full w-full flex-col gap-0 overflow-hidden py-0">
	<!-- Table Header -->
	<Card.Header class="px-4 py-3">
		<Card.Title>{title}</Card.Title>
		{#if description}
			<Card.Description>{description}</Card.Description>
		{/if}
	</Card.Header>
	<div class="border-b px-4 py-3">
		<p class="text-xs text-muted-foreground">
			{data.length} registros • Página {currentPage + 1} de {totalPages}
		</p>
	</div>

	<!-- Table Content -->
	<div class="flex-1 overflow-auto">
		<Table.Root>
			<Table.Header>
				{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
					<Table.Row>
						{#each headerGroup.headers as header (header.id)}
							<Table.Head class="text-xs">
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
					<Table.Row>
						{#each row.getVisibleCells() as cell (cell.id)}
							<Table.Cell class="text-xs">
								{#if cell.column.id === 'status'}
									{@const status = cell.getValue() as string}
									<span
										class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium {status ===
										'pago'
											? 'bg-green-50 text-green-700'
											: status === 'pendente'
												? 'bg-yellow-50 text-yellow-700'
												: status === 'vencido'
													? 'bg-red-50 text-red-700'
													: 'bg-gray-50 text-gray-700'}"
									>
										{status}
									</span>
								{:else}
									<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
								{/if}
							</Table.Cell>
						{/each}
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell
							colspan={columns.length}
							class="h-24 text-center text-xs text-muted-foreground"
						>
							Nenhum dado encontrado.
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>

	<!-- Pagination -->
	{#if showPagination && totalPages > 1}
		<div class="border-t px-4 py-2">
			<div class="flex items-center justify-between">
				<div class="text-xs text-muted-foreground">
					Mostrando {Math.min(currentPage * pagination.pageSize + 1, data.length)} a {Math.min(
						(currentPage + 1) * pagination.pageSize,
						data.length
					)} de {data.length} registros
				</div>
				<div class="flex items-center space-x-2">
					<Button
						variant="outline"
						size="sm"
						onclick={() => table.previousPage()}
						disabled={!canPreviousPage}
						class="h-8 w-8 p-0"
					>
						<ChevronLeftIcon class="h-4 w-4" />
					</Button>
					<span class="text-xs text-muted-foreground">
						{currentPage + 1} / {totalPages}
					</span>
					<Button
						variant="outline"
						size="sm"
						onclick={() => table.nextPage()}
						disabled={!canNextPage}
						class="h-8 w-8 p-0"
					>
						<ChevronRightIcon class="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	{/if}
</Card.Root>
