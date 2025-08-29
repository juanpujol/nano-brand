<script lang="ts">
	import * as Chart from '$lib/components/ui/chart';
	import * as Card from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';
	import { scaleUtc, scaleBand } from 'd3-scale';
	import { Area, AreaChart, LineChart, BarChart } from 'layerchart';
	import { curveNatural } from 'd3-shape';
	import seriesMockData from '$lib/data/series-mock-data.json';

	type ChartType = 'area' | 'line' | 'bar';

	import type { SeriesChartWidgetProps } from '$lib/types/dashboard';

	type Props = SeriesChartWidgetProps;

	let {
		variant = 'area' as ChartType,
		title = 'Total Visitors',
		description,
		data = [],
		series = [
			{ key: 'desktop', label: 'Desktop', color: 'var(--chart-1)' },
			{ key: 'mobile', label: 'Mobile', color: 'var(--chart-2)' }
		]
	}: Props = $props();

	const type = variant; // Keep internal type variable for backward compatibility

	// Chart height will be controlled by CSS container queries
	let chartContainerElement: HTMLElement | undefined = $state();
	let containerWidth = $state(800); // Default width

	// Update container width when element is available
	$effect(() => {
		if (chartContainerElement) {
			const updateWidth = () => {
				containerWidth = chartContainerElement!.getBoundingClientRect().width;
			};

			// Initial measurement
			updateWidth();

			// Listen for resize events
			const resizeObserver = new ResizeObserver(updateWidth);
			resizeObserver.observe(chartContainerElement);

			return () => {
				resizeObserver.disconnect();
			};
		}
	});

	// Use provided data or fall back to mock data
	const mockData = seriesMockData.dailyVisitors.map((item) => ({
		...item,
		date: new Date(item.date)
	}));

	const chartData = $derived(
		data && Array.isArray(data) && data.length > 0
			? data.map((item: unknown) => {
					const typedItem = item as Record<string, unknown>;
					return {
						...typedItem,
						date: new Date(typedItem.date as string | Date)
					};
				})
			: mockData
	);
	let timeRange = $state('90d');
	const selectedLabel = $derived.by(() => {
		switch (timeRange) {
			case '90d':
				return 'Last 3 months';
			case '30d':
				return 'Last 30 days';
			case '7d':
				return 'Last 7 days';
			default:
				return 'Last 3 months';
		}
	});
	const filteredData = $derived(
		chartData.filter((item: Record<string, unknown> & { date: Date }) => {
			let daysToSubtract = 90;
			if (timeRange === '30d') {
				daysToSubtract = 30;
			} else if (timeRange === '7d') {
				daysToSubtract = 7;
			}
			const referenceDate = new Date('2024-06-30');
			const cutoffDate = new Date(referenceDate.getTime() - daysToSubtract * 24 * 60 * 60 * 1000);
			return item.date >= cutoffDate;
		})
	);
	// Generate chart config from series prop
	const chartConfig = $derived(
		series.reduce(
			(
				config: Record<string, { label: string; color: string }>,
				seriesItem: { key: string; label: string; color?: string }
			) => {
				config[seriesItem.key] = {
					label: seriesItem.label,
					color: seriesItem.color || `var(--chart-${Object.keys(config).length + 1})`
				};
				return config;
			},
			{} as Record<string, { label: string; color: string }>
		) satisfies Chart.ChartConfig
	);

	// Initialize visibility state for all series
	let visibleSeries = $state<Record<string, boolean>>({});

	// Set initial visibility when series changes
	$effect(() => {
		const initialVisibility: Record<string, boolean> = {};
		series.forEach((seriesItem: { key: string; label: string; color?: string }) => {
			initialVisibility[seriesItem.key] = true;
		});
		visibleSeries = initialVisibility;
	});

	const allSeries = $derived(series);

	const filteredSeries = $derived(
		allSeries.filter(
			(seriesItem: { key: string; label: string; color?: string }) => visibleSeries[seriesItem.key]
		)
	);

	const dateRange = $derived.by(() => {
		let daysToSubtract = 90;
		if (timeRange === '30d') {
			daysToSubtract = 30;
		} else if (timeRange === '7d') {
			daysToSubtract = 7;
		}
		const referenceDate = new Date('2024-06-30');
		const startDate = new Date(referenceDate.getTime() - daysToSubtract * 24 * 60 * 60 * 1000);

		const formatDate = (date: Date) => {
			return date.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric'
			});
		};

		return `${formatDate(startDate)} - ${formatDate(referenceDate)}`;
	});
</script>

<Card.Root
	class="@container/card relative flex h-full w-full flex-col gap-0 overflow-clip py-4"
	data-widget-rows
>
	<Card.Header class="px-4">
		<Card.Title>{title}</Card.Title>
		<Card.Description>
			{#if description}
				{description}
			{:else}
				<span class="hidden @[540px]/card:block">{dateRange}</span>
				<span class="@[540px]/card:hidden">{selectedLabel}</span>
			{/if}
		</Card.Description>
		<Card.Action>
			<ToggleGroup.Root
				type="single"
				bind:value={timeRange}
				variant="outline"
				class="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
			>
				<ToggleGroup.Item value="90d">Last 3 months</ToggleGroup.Item>
				<ToggleGroup.Item value="30d">Last 30 days</ToggleGroup.Item>
				<ToggleGroup.Item value="7d">Last 7 days</ToggleGroup.Item>
			</ToggleGroup.Root>
			<Select.Root type="single" bind:value={timeRange}>
				<Select.Trigger
					size="sm"
					class="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
					aria-label="Select a value"
				>
					<span data-slot="select-value">
						{selectedLabel}
					</span>
				</Select.Trigger>
				<Select.Content class="rounded-xl">
					<Select.Item value="90d" class="rounded-lg">Last 3 months</Select.Item>
					<Select.Item value="30d" class="rounded-lg">Last 30 days</Select.Item>
					<Select.Item value="7d" class="rounded-lg">Last 7 days</Select.Item>
				</Select.Content>
			</Select.Root>
		</Card.Action>
	</Card.Header>
	<Card.Content class="flex-1 px-2 py-2 sm:px-4">
		<div bind:this={chartContainerElement} class="chart-wrapper h-full w-full">
			<Chart.Container
				config={chartConfig}
				class="chart-container relative h-full w-full {type === 'bar' ? 'pb-3' : 'pb-0'}"
				data-chart-type={type}
			>
				{#if type === 'area'}
					<AreaChart
						data={filteredData}
						x="date"
						xScale={scaleUtc()}
						series={filteredSeries}
						seriesLayout="overlap"
						props={{
							area: {
								curve: curveNatural,
								'fill-opacity': 0.4,
								line: { class: 'stroke-1' },
								motion: 'tween'
							},
							xAxis: {
								ticks: timeRange === '7d' ? 7 : undefined,
								format: (v) => {
									return v.toLocaleDateString('en-US', {
										month: 'short',
										day: 'numeric'
									});
								}
							},
							yAxis: { format: () => '' }
						}}
					>
						{#snippet marks({ series, getAreaProps })}
							<defs>
								<linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stop-color="var(--color-desktop)" stop-opacity={1.0} />
									<stop offset="95%" stop-color="var(--color-desktop)" stop-opacity={0.1} />
								</linearGradient>
								<linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stop-color="var(--color-mobile)" stop-opacity={0.8} />
									<stop offset="95%" stop-color="var(--color-mobile)" stop-opacity={0.1} />
								</linearGradient>
							</defs>
							{#each series as s, i (s.key)}
								<Area
									{...getAreaProps(s, i)}
									fill={s.key === 'desktop' ? 'url(#fillDesktop)' : 'url(#fillMobile)'}
								/>
							{/each}
						{/snippet}
						{#snippet tooltip()}
							{@render customTooltip()}
						{/snippet}
						{#snippet legend()}
							{@render customLegend()}
						{/snippet}
					</AreaChart>
				{:else if type === 'line'}
					<LineChart
						data={filteredData}
						x="date"
						xScale={scaleUtc()}
						series={filteredSeries}
						props={{
							spline: { curve: curveNatural, motion: 'tween', strokeWidth: 2 },
							xAxis: {
								ticks: timeRange === '7d' ? 7 : undefined,
								format: (v) => {
									return v.toLocaleDateString('en-US', {
										month: 'short',
										day: 'numeric'
									});
								}
							},
							yAxis: { format: () => '' }
						}}
					>
						{#snippet tooltip()}
							{@render customTooltip()}
						{/snippet}
						{#snippet legend()}
							{@render customLegend()}
						{/snippet}
					</LineChart>
				{:else if type === 'bar'}
					<BarChart
						data={filteredData}
						x="date"
						xScale={scaleBand().padding(0.25)}
						axis="x"
						series={filteredSeries}
						seriesLayout="group"
						padding={{ left: 18 }}
						props={{
							bars: {
								stroke: 'none',
								rounded: 'none'
							},
							xAxis: {
								format: (d) => {
									return d.toLocaleDateString('en-US', {
										month: 'short',
										day: 'numeric'
									});
								},
								ticks: (scale) => {
									// Use fewer ticks on narrow containers (like mobile or single column)
									const isMobile = containerWidth < 400;
									let tickCount;
									if (isMobile) {
										tickCount = timeRange === '7d' ? 4 : timeRange === '30d' ? 3 : 4;
									} else {
										tickCount = timeRange === '7d' ? 7 : timeRange === '30d' ? 6 : 8;
									}
									return scaleUtc(scale.domain(), scale.range()).ticks(tickCount);
								}
							},
							yAxis: { format: () => '' }
						}}
					>
						{#snippet tooltip()}
							{@render customTooltip()}
						{/snippet}
						{#snippet legend()}
							{@render customLegend()}
						{/snippet}
					</BarChart>
				{/if}
			</Chart.Container>
		</div>
	</Card.Content>
</Card.Root>

{#snippet customTooltip()}
	<Chart.Tooltip
		labelFormatter={(value: unknown) => {
			const date = value instanceof Date ? value : new Date(value as string);
			return date.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric'
			});
		}}
		indicator="line"
	/>
{/snippet}

{#snippet customLegend()}
	<div>
		<div class="custom-legend flex items-center justify-center gap-4">
			{#each allSeries as series (series.key)}
				<button
					class="flex items-center gap-1.5 text-sm transition-opacity {visibleSeries[
						series.key as keyof typeof visibleSeries
					]
						? 'opacity-100'
						: 'opacity-50'}"
					onclick={() => {
						const key = series.key as keyof typeof visibleSeries;
						visibleSeries[key] = !visibleSeries[key];
					}}
				>
					<div class="size-2.5 rounded-[2px]" style="background-color: {series.color}"></div>
					{series.label}
				</button>
			{/each}
		</div>
	</div>
{/snippet}

<style>
	/* Enable size-based container queries */
	:global([data-widget-rows]) {
		container-type: size;
	}

	:global(.chart-container) {
		container-type: size;
	}

	/* Default chart height for small containers */
	:global(.chart-container) {
		height: 120px;
	}

	/* Medium containers (like h=1.5 or transitional sizes) */
	@container (min-height: 300px) {
		:global(.chart-container) {
			height: 250px;
		}
	}

	/* Large containers (like h=2 - 500px height) */
	@container (min-height: 450px) {
		:global(.chart-container) {
			height: 365px;
		}
	}

	/* Responsive tick adjustments for narrow containers */
	@container (max-width: 400px) {
		/* CSS will be combined with container queries for fine control if needed */
	}

	:global(.lc-legend-container) {
		left: calc(50% + 20px) !important;
		transform: translateX(-50%) !important;
		top: auto !important;
		bottom: -10px !important;
	}

	.custom-legend {
		position: absolute;
		bottom: -35px;
		left: 50%;
		transform: translateX(-50%);
	}

	:global([data-chart-type='bar']) .custom-legend {
		bottom: -50px !important;
	}
</style>
