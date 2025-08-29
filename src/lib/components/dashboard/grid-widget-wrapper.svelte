<script lang="ts">
	import CounterWidget from '$lib/components/widgets/counter-widget.svelte';
	import SeriesChartWidget from '$lib/components/widgets/series-chart-widget.svelte';
	import TestWidget from '$lib/components/widgets/test-widget.svelte';
	import TableWidget from '$lib/components/widgets/table-widget.svelte';
	import PieWidget from '$lib/components/widgets/pie-widget.svelte';
	import type {
		DashboardWidget,
		SeriesChartWidgetProps,
		TableWidgetProps,
		PieWidgetProps,
		CounterWidgetProps,
		TestWidgetProps
	} from '$lib/types/dashboard';

	interface Props {
		widget: DashboardWidget;
	}

	let { widget }: Props = $props();
</script>

<div class="grid-widget-wrapper h-full w-full">
	{#if widget.type === 'counter'}
		{@const props = widget.props as CounterWidgetProps}
		<CounterWidget
			title={props?.title}
			description={props?.description}
			data={props?.data}
			period={props?.period}
			icon={props?.icon}
			iconColor={props?.iconColor}
		/>
	{:else if widget.type === 'series-chart'}
		{@const props = widget.props as SeriesChartWidgetProps}
		<SeriesChartWidget
			title={props?.title}
			description={props?.description}
			data={props?.data}
			variant={props?.variant || 'area'}
			series={props?.series}
		/>
	{:else if widget.type === 'test'}
		{@const props = widget.props as TestWidgetProps}
		<TestWidget title={props?.title} description={props?.description} color={props?.color} />
	{:else if widget.type === 'table'}
		{@const props = widget.props as TableWidgetProps}
		<TableWidget
			title={props?.title}
			description={props?.description}
			data={props?.data || []}
			pageSize={props?.pageSize || 10}
			showPagination={props?.showPagination ?? true}
		/>
	{:else if widget.type === 'pie'}
		{@const props = widget.props as PieWidgetProps}
		<PieWidget
			variant={props?.variant || 'pie'}
			title={props?.title}
			description={props?.description}
			showLegend={props?.showLegend ?? true}
			data={props?.data}
		/>
	{/if}

	<!-- Visual indicator that sits over the real GridStack resize handle -->
	<div class="resize-handle-indicator">
		<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
			<circle cx="2" cy="2" r="1" fill="currentColor" opacity="0.4" />
			<circle cx="6" cy="2" r="1" fill="currentColor" opacity="0.4" />
			<circle cx="10" cy="2" r="1" fill="currentColor" opacity="0.4" />
			<circle cx="2" cy="6" r="1" fill="currentColor" opacity="0.4" />
			<circle cx="6" cy="6" r="1" fill="currentColor" opacity="0.4" />
			<circle cx="10" cy="6" r="1" fill="currentColor" opacity="0.4" />
			<circle cx="2" cy="10" r="1" fill="currentColor" opacity="0.4" />
			<circle cx="6" cy="10" r="1" fill="currentColor" opacity="0.4" />
			<circle cx="10" cy="10" r="1" fill="currentColor" opacity="0.4" />
		</svg>
	</div>
</div>

<style>
	.grid-widget-wrapper {
		position: relative;
		overflow: hidden;
		height: 100%;
		width: 100%;
		padding: var(--widget-padding, 8px);
	}

	.resize-handle-indicator {
		position: absolute;
		bottom: 6px;
		right: 6px;
		color: hsl(var(--muted-foreground));
		opacity: 0;
		transition: opacity 0.2s ease;
		pointer-events: auto;
		z-index: 20;
		background: hsl(var(--background) / 0.8);
		border-radius: 4px;
		padding: 2px;
		backdrop-filter: blur(4px);
		cursor: nw-resize;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	:global(.grid-stack > .grid-stack-item > .grid-stack-item-content) {
		box-shadow: none;
		border-radius: 0;
	}

	/* Show resize handle only in edit mode and on hover */
	:global(.grid-stack-item-content.edit-mode) .resize-handle-indicator {
		opacity: 0.6;
	}

	:global(.grid-stack-item-content.edit-mode:hover) .resize-handle-indicator {
		opacity: 1;
	}

	/* Hide completely when not in edit mode */
	:global(.grid-stack-item-content:not(.edit-mode)) .resize-handle-indicator {
		display: none;
	}
</style>
