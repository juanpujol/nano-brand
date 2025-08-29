<script lang="ts">
	import * as Chart from '$lib/components/ui/chart';
	import * as Card from '$lib/components/ui/card';
	import { PieChart } from 'layerchart';
	import pieMockData from '$lib/data/pie-mock-data.json';

	type ChartType = 'pie' | 'donut';

	interface ChartData {
		key: string;
		value: number;
		label: string;
		color?: string;
	}

	import type { PieWidgetProps } from '$lib/types/dashboard';

	type Props = PieWidgetProps;

	let {
		variant = 'pie' as ChartType,
		data = [],
		showLegend = true,
		title = 'Chart Distribution',
		description = 'Data visualization'
	}: Props = $props();

	const type = variant; // Keep internal type variable for backward compatibility

	// Default sample data if none provided
	const defaultData: ChartData[] = pieMockData.default;

	const chartData = $derived(data.length > 0 ? data : defaultData);

	// Generate chart config from data
	const chartConfig = $derived(
		chartData.reduce(
			(config, item) => {
				config[item.key] = {
					label: item.label,
					color: item.color || `var(--chart-${Object.keys(config).length + 1})`
				};
				return config;
			},
			{} as Record<string, { label: string; color: string }>
		) satisfies Chart.ChartConfig
	);

	// Simple visibility state - no effects needed
	let visibleSegments = $state<Record<string, boolean>>({});

	// Filter data based on visibility, defaulting to visible if not set
	const filteredData = $derived(chartData.filter((item) => visibleSegments[item.key] ?? true));

	// Toggle function
	function toggleSegment(key: string) {
		visibleSegments[key] = !(visibleSegments[key] ?? true);
	}

	// Calculate total for percentage display
	const totalValue = $derived(filteredData.reduce((sum, item) => sum + item.value, 0));

	// Chart props based on type
	const chartProps = $derived({
		innerRadius: type === 'donut' ? 40 : 0,
		padding: type === 'donut' ? 10 : 10
	});
</script>

<Card.Root
	class="@container/card relative flex h-full w-full flex-col gap-0 overflow-clip py-4"
	data-widget-rows
>
	<Card.Header class="px-4">
		<Card.Title>{title}</Card.Title>
		<Card.Description>{description}</Card.Description>
	</Card.Header>

	<Card.Content class="flex-1 px-2 py-2 sm:px-4">
		<div class="flex h-full items-center justify-center gap-6">
			<!-- Chart Container -->
			<div class="pie-chart-container flex-shrink-0">
				<Chart.Container config={chartConfig} class="relative aspect-square h-full w-full">
					{#if filteredData.length > 0}
						<PieChart
							data={filteredData}
							key="key"
							value="value"
							label={(d) => d.label}
							c="color"
							{...chartProps}
						>
							{#snippet tooltip()}
								<Chart.Tooltip hideLabel />
							{/snippet}
						</PieChart>
					{:else}
						<div class="flex h-full items-center justify-center text-muted-foreground">
							No data to display
						</div>
					{/if}
				</Chart.Container>
			</div>

			<!-- Vertical Legend on Right -->
			{#if showLegend}
				<div class="flex min-w-0 flex-col justify-center gap-2">
					<!-- Total count at top of legend -->
					<div class="border-b pb-1 text-xs font-medium text-muted-foreground">
						Total: {totalValue.toLocaleString()}
					</div>
					{@render customLegend()}
				</div>
			{/if}
		</div>
	</Card.Content>
</Card.Root>

{#snippet customLegend()}
	<div class="flex flex-col gap-1.5">
		{#each chartData as segment (segment.key)}
			<button
				class="flex items-center gap-2 text-left text-xs transition-opacity {(visibleSegments[
					segment.key
				] ?? true)
					? 'opacity-100'
					: 'opacity-50'}"
				onclick={() => toggleSegment(segment.key)}
			>
				<div
					class="size-2.5 flex-shrink-0 rounded-[2px] {type === 'pie' ? 'rounded-full' : ''}"
					style="background-color: {segment.color}"
				></div>
				<div class="flex min-w-0 gap-1">
					<span class="truncate font-medium">{segment.label}</span>
					<span class="text-muted-foreground">
						{segment.value} ({(
							(segment.value / chartData.reduce((sum, item) => sum + item.value, 0)) *
							100
						).toFixed(0)}%)
					</span>
				</div>
			</button>
		{/each}
	</div>
{/snippet}

<style>
	/* Hide default layerchart legend since we use custom */
	:global(.lc-legend-container) {
		display: none;
	}

	/* Enable size-based container queries for height */
	:global([data-widget-rows]) {
		container-type: size;
	}

	/* Fixed chart size - only scale based on height, not width */
	.pie-chart-container {
		width: 150px;
		height: 150px;
	}

	/* Scale only when height allows it */
	@container (min-height: 250px) and (min-width: 500px) {
		.pie-chart-container {
			width: 300px;
			height: 300px;
		}
	}

	@container (min-height: 500px) and (min-width: 500px) {
		.pie-chart-container {
			width: 400px;
			height: 400px;
		}
	}
</style>
