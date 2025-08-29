<script lang="ts">
	import { type ColumnDef, getCoreRowModel, getPaginationRowModel } from '@tanstack/table-core';
	import { createSvelteTable, FlexRender, renderComponent } from '$lib/components/ui/data-table';
	import * as Table from '$lib/components/ui/table';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { ChevronLeft, ChevronRight, Search, Plus } from '@lucide/svelte';
	import SegmentNameCell from '$lib/components/segment/segment-name-cell.svelte';
	import type { Segment } from '$lib/types/segments';
	import type { PageData } from './$types';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	// Organization data from parent layout
	const orgData = $derived(page.data);

	// Search state
	let searchTerm = $state(page.url.searchParams.get('search') || '');
	let searchTimeout: ReturnType<typeof setTimeout>;

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

	// Handle opening segment for editing
	function openSegment(segment: Segment) {
		goto(`/orgs/${page.params.orgId}/segments/${segment.id}`);
	}

	// Format date in Portuguese
	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	// Format lead count with proper pluralization
	function formatLeadCount(count: number): string {
		return `${count.toLocaleString('pt-BR')} lead${count !== 1 ? 's' : ''}`;
	}

	// Format temporal filter information
	function formatPeriod(segment: Segment): string {
		if (!segment.rule_json?.periodFilter) {
			return 'Sem filtro temporal';
		}

		const { timeFilterType, periodValue } = segment.rule_json.periodFilter;

		// Format the time filter type
		const timeFilterLabels: Record<string, string> = {
			'lead.createdAt': 'Lead criado',
			'conversion.first': 'Primeira conversão',
			'conversion.last': 'Última conversão',
			'conversion.any': 'Qualquer conversão',
			'conversion.first_strict': 'Primeira conversão (estrita)',
			'conversion.last_strict': 'Última conversão (estrita)'
		};

		// Format the period value
		let periodText = '';
		if (periodValue.type === 'relative' && periodValue.relativeValue) {
			const relativePeriodLabels: Record<string, string> = {
				today: 'hoje',
				yesterday: 'ontem',
				thisWeek: 'esta semana',
				lastWeek: 'semana passada',
				thisMonth: 'este mês',
				lastMonth: 'mês passado',
				last30days: 'últimos 30 dias',
				last90days: 'últimos 90 dias',
				thisQuarter: 'este trimestre',
				lastQuarter: 'trimestre passado',
				thisYear: 'este ano',
				lastYear: 'ano passado'
			};
			periodText = relativePeriodLabels[periodValue.relativeValue] || periodValue.relativeValue;
		} else if (periodValue.type === 'absolute' && periodValue.dateRange) {
			const from = new Date(periodValue.dateRange.from);
			const to = periodValue.dateRange.to ? new Date(periodValue.dateRange.to) : null;

			if (to) {
				periodText = `${from.toLocaleDateString('pt-BR')} - ${to.toLocaleDateString('pt-BR')}`;
			} else {
				periodText = `a partir de ${from.toLocaleDateString('pt-BR')}`;
			}
		}

		const timeFilterLabel = timeFilterLabels[timeFilterType] || timeFilterType;
		return `${timeFilterLabel} no período: ${periodText}`;
	}

	// Define columns for the segments table
	const columns: ColumnDef<Segment>[] = [
		{
			accessorKey: 'name',
			header: 'Segmento',
			cell: ({ row }) => {
				return renderComponent(SegmentNameCell, {
					name: row.original.name,
					description: row.original.description
				});
			},
			size: 400
		},
		{
			accessorKey: 'lead_count',
			header: 'Leads',
			cell: (info) => {
				const count = info.getValue() as number;
				return formatLeadCount(count);
			},
			size: 120,
			meta: { align: 'right' }
		},
		{
			accessorKey: 'condition',
			header: 'Condição',
			cell: ({ row }) => {
				const periodInfo = formatPeriod(row.original);
				const lines = periodInfo.split(': ');
				if (lines.length === 2) {
					return `${lines[0]}\n${lines[1]}`;
				}
				return periodInfo;
			},
			size: 200
		},
		{
			accessorKey: 'updated_at',
			header: 'Atualizado',
			cell: (info) => formatDate(info.getValue() as string),
			size: 120,
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
			data: data.segments,
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
	<title>Segmentações | {orgData.currentOrganization?.name || 'Organização'} | Laiki</title>
</svelte:head>

<div class="mx-auto w-full max-w-7xl space-y-6 p-6">
	<!-- Page Header -->
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div>
			<h1 class="text-3xl font-semibold tracking-tight">Segmentações</h1>
			<p class="text-muted-foreground">
				{data.total} segmentação{data.total !== 1 ? 's' : ''} encontrado{data.total !== 1
					? 's'
					: ''}
			</p>
		</div>
		<div class="flex items-center space-x-2">
			<div class="relative">
				<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="text"
					placeholder="Buscar por nome ou descrição..."
					bind:value={searchTerm}
					oninput={handleSearch}
					class="w-full pl-9 md:w-64"
				/>
			</div>
			<Button onclick={() => goto(`/orgs/${page.params.orgId}/segments/new`)} class="shrink-0">
				<Plus class="mr-2 h-4 w-4" />
				Nova Segmentação
			</Button>
		</div>
	</div>

	<!-- Data Table Card -->
	<Card.Root class="flex w-full flex-col gap-0 overflow-hidden py-0">
		<!-- Table Content -->
		<div class="overflow-auto md:max-w-[calc(100vw-var(--sidebar-width)-4rem)]" id="segments-table">
			<Table.Root>
				<Table.Header>
					{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
						<Table.Row>
							{#each headerGroup.headers as header (header.id)}
								<Table.Head
									class="px-4 py-3 text-sm font-medium {header.column.columnDef.meta?.align ===
									'right'
										? 'text-right'
										: header.column.columnDef.meta?.align === 'center'
											? 'text-center'
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
							onclick={() => openSegment(row.original)}
						>
							{#each row.getVisibleCells() as cell (cell.id)}
								<Table.Cell
									class="px-4 py-3 text-sm {cell.column.id === 'lead_count' ||
									cell.column.id === 'updated_at'
										? 'text-right'
										: ''}"
								>
									{#if cell.column.id === 'lead_count'}
										<span class="font-medium">
											<FlexRender
												content={cell.column.columnDef.cell}
												context={cell.getContext()}
											/>
										</span>
									{:else if cell.column.id === 'updated_at'}
										<span class="text-muted-foreground">
											<FlexRender
												content={cell.column.columnDef.cell}
												context={cell.getContext()}
											/>
										</span>
									{:else if cell.column.id === 'condition'}
										{@const periodInfo = formatPeriod(row.original)}
										{@const parts = periodInfo.split(' no período: ')}
										<div class="max-w-[200px] text-xs text-muted-foreground">
											{#if parts.length === 2}
												<div class="font-medium text-foreground">{parts[0]}</div>
												<div class="mt-1">{parts[1]}</div>
											{:else}
												<div>{periodInfo}</div>
											{/if}
										</div>
									{:else}
										<div
											class="{cell.column.id === 'name'
												? 'font-medium'
												: cell.column.id === 'description'
													? 'max-w-[400px] text-muted-foreground'
													: 'max-w-[120px] text-muted-foreground'} {cell.column.id === 'name' ||
											cell.column.id === 'description'
												? 'truncate'
												: ''}"
											title={cell.column.id === 'description' && cell.getValue()
												? String(cell.getValue())
												: undefined}
										>
											<FlexRender
												content={cell.column.columnDef.cell}
												context={cell.getContext()}
											/>
										</div>
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
								Nenhuma segmentação encontrada.
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
						Página {currentPage} de {totalPages} • {data.total} segmento{data.total !== 1
							? 's'
							: ''} no total
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
