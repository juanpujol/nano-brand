<script lang="ts">
	import { DashboardGrid, ShareMenu } from '$lib/components/dashboard';
	import { Button } from '$lib/components/ui/button';
	import * as Select from '$lib/components/ui/select';
	import { PlusIcon, EditIcon } from '@lucide/svelte';
	import { page } from '$app/state';
	import type { PageData } from './$types';
	import type { DashboardGridConfig, DashboardWidget, WidgetType } from '$lib/types/dashboard';
	import { WIDGET_DEFAULTS } from '$lib/types/dashboard';
	import { nanoid } from 'nanoid';
	import tableData from '$lib/data/table-mock-data.json';
	import pieMockData from '$lib/data/pie-mock-data.json';
	import widgetsMockData from '$lib/data/widgets-mock-data.json';
	import dashboardsData from '$lib/data/dashboards-mock-data.json';

	let { data }: { data: PageData } = $props();

	// Get the current organization and membership
	// const currentOrganization = data.currentOrganization;
	// const currentMembership = data.currentMembership;

	// Suppress unused data warning - used for type validation
	void data;

	// Organization data from parent layout
	const orgData = $derived(page.data);

	// Get current dashboard info
	const currentDashId = $derived(page.params.dashId);
	const currentDashboard = $derived(
		dashboardsData.find((dashboard) => {
			const dashId = dashboard.href === '/' ? 'general' : dashboard.href.slice(1);
			return dashId === currentDashId;
		})
	);

	let selectedPeriod = $state('Hoje');

	// Grid reference
	let dashboardGrid = $state<DashboardGrid | null>(null);

	// Process widgets mock data to handle dataSource references and Date objects
	const processedWidgets: DashboardWidget[] = widgetsMockData.map((widget) => {
		const processedWidget = { ...widget } as DashboardWidget & { props: Record<string, unknown> };

		// Handle Date objects
		if (processedWidget.props?.period) {
			const period = processedWidget.props.period as { label: string; start: string; end: string };
			processedWidget.props = {
				...processedWidget.props,
				period: {
					...period,
					start: new Date(period.start),
					end: new Date(period.end)
				}
			};
		}

		// Handle data source references
		if (processedWidget.props?.dataSource) {
			const dataSource = processedWidget.props.dataSource;
			processedWidget.props = { ...processedWidget.props };
			delete processedWidget.props.dataSource;

			if (dataSource === 'tableData') {
				processedWidget.props.data = tableData;
			} else if (dataSource === 'pieMockData.deviceTypes') {
				processedWidget.props.data = pieMockData.deviceTypes;
			} else if (dataSource === 'pieMockData.browserUsage') {
				processedWidget.props.data = pieMockData.browserUsage;
			}
		}

		return processedWidget as DashboardWidget;
	});

	// Grid configuration
	let gridConfig = $state<DashboardGridConfig>({
		editMode: false, // Start in view mode
		widgets: processedWidgets
	});

	const periods = [
		{ value: 'Hoje', label: 'Hoje' },
		{ value: 'Ontem', label: 'Ontem' },
		{ value: 'Esta semana', label: 'Esta semana' },
		{ value: 'Semana passada', label: 'Semana passada' },
		{ value: 'Este mes', label: 'Este mês' },
		{ value: 'Mes passado', label: 'Mês passado' },
		{ value: 'Este trimestre', label: 'Este trimestre' },
		{ value: 'Trimestre passado', label: 'Trimestre passado' },
		{ value: 'Periodo especifico', label: 'Período específico' }
	];

	const selectedPeriodLabel = $derived(
		periods.find((p) => p.value === selectedPeriod)?.label ?? 'Selecione o período'
	);

	function handleExportPDF() {
		// TODO: Implement PDF export functionality
	}

	function handleExportImage() {
		// TODO: Implement image export functionality
	}

	function handlePublicLink() {
		// TODO: Implement public link functionality
	}

	function handleSendEmail() {
		// TODO: Implement email functionality
	}

	function toggleEditMode() {
		gridConfig.editMode = !gridConfig.editMode;
	}

	function handleGridConfigChange(newConfig: DashboardGridConfig) {
		// Log the updated widgets configuration for debugging
		console.log('processedWidgets updated:', JSON.stringify(newConfig.widgets, null, 2));
		gridConfig = newConfig;
	}

	function addNewWidget() {
		// Available widget types
		const widgetTypes: WidgetType[] = ['counter', 'series-chart', 'test', 'table', 'pie'];
		const randomType = widgetTypes[Math.floor(Math.random() * widgetTypes.length)];

		// Find the bottom position in the grid
		const bottomPosition = findBottomPosition(randomType);

		// Create widget with appropriate props
		const newWidget: DashboardWidget = {
			id: nanoid(),
			type: randomType,
			x: bottomPosition.x,
			y: bottomPosition.y,
			w: WIDGET_DEFAULTS[randomType].w,
			h: WIDGET_DEFAULTS[randomType].h,
			...getWidgetProps(randomType)
		};

		// Use the dashboard-grid component's addWidget function
		if (dashboardGrid) {
			dashboardGrid.addWidget(newWidget);
		}
	}

	function findBottomPosition(widgetType: keyof typeof WIDGET_DEFAULTS) {
		// Find the maximum Y + height among all widgets
		let maxBottomY = 0;
		for (const widget of gridConfig.widgets) {
			const widgetBottom = widget.y + widget.h;
			if (widgetBottom > maxBottomY) {
				maxBottomY = widgetBottom;
			}
		}

		// For widgets that need full width (series-chart), place at x=0
		if (WIDGET_DEFAULTS[widgetType].w === 3) {
			return { x: 0, y: maxBottomY };
		}

		// For smaller widgets, find a suitable x position
		const widgetWidth = WIDGET_DEFAULTS[widgetType].w;
		const maxX = 3 - widgetWidth; // GridStack has 3 columns
		const randomX = Math.floor(Math.random() * (maxX + 1));

		return { x: randomX, y: maxBottomY };
	}

	function getWidgetProps(
		widgetType: keyof typeof WIDGET_DEFAULTS
	): Partial<Pick<DashboardWidget, 'props'>> {
		switch (widgetType) {
			case 'series-chart': {
				const chartTypes = ['area', 'line', 'bar'] as const;
				const randomChartType = chartTypes[Math.floor(Math.random() * chartTypes.length)];
				return { props: { type: randomChartType } };
			}
			case 'test': {
				const colors = [
					'bg-red-500',
					'bg-blue-500',
					'bg-green-500',
					'bg-purple-500',
					'bg-orange-500'
				];
				const titles = [
					'Test Widget',
					'Sample Widget',
					'Demo Widget',
					'Random Widget',
					'New Widget'
				];
				const randomColor = colors[Math.floor(Math.random() * colors.length)];
				const randomTitle = titles[Math.floor(Math.random() * titles.length)];
				return { props: { color: randomColor, title: randomTitle } };
			}
			case 'table': {
				return {
					props: {
						data: tableData,
						pageSize: 8,
						showPagination: true
					}
				};
			}
			case 'pie': {
				const pieTypes = ['pie', 'donut'] as const;
				const randomPieType = pieTypes[Math.floor(Math.random() * pieTypes.length)];
				const titles = [
					'Browser Usage',
					'Device Types',
					'Traffic Sources',
					'User Segments',
					'Revenue by Category'
				];
				const descriptions = [
					'Distribution by category',
					'Performance breakdown',
					'Usage analytics',
					'Data insights',
					'Metrics overview'
				];
				const randomTitle = titles[Math.floor(Math.random() * titles.length)];
				const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];

				// Generate random data
				const categories = ['Category A', 'Category B', 'Category C', 'Category D', 'Category E'];
				const data = categories.slice(0, Math.floor(Math.random() * 3) + 3).map((cat, index) => ({
					key: cat.toLowerCase().replace(' ', ''),
					value: Math.floor(Math.random() * 400) + 50,
					label: cat,
					color: `var(--chart-${index + 1})`
				}));

				return {
					props: {
						type: randomPieType,
						title: randomTitle,
						description: randomDescription,
						showLegend: true,
						data
					}
				};
			}
			default:
				return {};
		}
	}
</script>

<svelte:head>
	<title>Dashboard | {orgData.currentOrganization?.name || 'Organização'} | Laiki</title>
</svelte:head>

<div class="mx-auto w-full max-w-7xl space-y-4">
	<header class="flex flex-col items-end justify-between gap-2 px-4 md:flex-row">
		<div class="mb-2 grid gap-1 md:mb-0">
			<h1 class="mb-0 text-2xl font-semibold">{currentDashboard?.title || 'Dashboard'}</h1>
			<p class="max-w-lg text-sm text-muted-foreground">
				{currentDashboard?.description || 'Dashboard description'}
			</p>
		</div>

		<div class="flex gap-2">
			{#if !gridConfig.editMode}
				<Select.Root type="single" bind:value={selectedPeriod}>
					<Select.Trigger class="w-[180px]">
						{selectedPeriodLabel}
					</Select.Trigger>
					<Select.Content>
						{#each periods as period (period.value)}
							<Select.Item value={period.value}>{period.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
				<ShareMenu
					onExportPDF={handleExportPDF}
					onExportImage={handleExportImage}
					onPublicLink={handlePublicLink}
					onSendEmail={handleSendEmail}
				/>
			{/if}
			{#if gridConfig.editMode}
				<Button size="sm" onclick={addNewWidget} class="size-9 md:w-auto md:px-3">
					<PlusIcon class="size-4 md:mr-2" />
					<span class="sr-only md:not-sr-only">Adicionar widget</span>
				</Button>
			{/if}
			<Button
				size="sm"
				onclick={toggleEditMode}
				variant="secondary"
				class="size-9 md:w-auto md:px-3"
			>
				<EditIcon class="size-4 md:mr-2" />
				<span class="sr-only md:not-sr-only">
					{gridConfig.editMode ? 'Sair do modo edição' : 'Editar layout'}
				</span>
			</Button>
		</div>
	</header>

	<div class="pb-6">
		<DashboardGrid
			bind:this={dashboardGrid}
			config={gridConfig}
			onConfigChange={handleGridConfigChange}
		/>
	</div>
</div>
