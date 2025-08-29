<script lang="ts">
	import 'gridstack/dist/gridstack.min.css';
	import { GridStack } from 'gridstack';
	import TestWidget from './widgets/test-widget.svelte';

	let gridContainer: HTMLDivElement;
	let grid: GridStack | null = null;

	// Simple test data
	const widgets = [
		{ x: 0, y: 0, w: 2, h: 2, id: '1', title: 'Widget 1', color: 'bg-blue-500' },
		{ x: 2, y: 0, w: 1, h: 1, id: '2', title: 'Widget 2', color: 'bg-red-500' },
		{ x: 0, y: 2, w: 3, h: 1, id: '3', title: 'Widget 3', color: 'bg-green-500' },
		{ x: 3, y: 1, w: 1, h: 2, id: '4', title: 'Widget 4', color: 'bg-purple-500' }
	];

	$effect(() => {
		if (!gridContainer) return;

		// Initialize with minimal options
		grid = GridStack.init(
			{
				float: true,
				cellHeight: 260,
				column: 3, // Set 3 columns as default
				margin: 0
			},
			gridContainer
		);

		// Handle responsive based on container width instead of window width
		const handleResize = () => {
			if (!grid || !gridContainer) return;
			const width = gridContainer.offsetWidth;
			if (width < 700) {
				// Mobile: 1 column
				if (grid.getColumn() !== 1) {
					grid.column(1);
				}
			} else if (width < 1024) {
				// Tablet: 2 columns
				if (grid.getColumn() !== 2) {
					grid.column(2);
				}
			} else {
				// Desktop: 3 columns
				if (grid.getColumn() !== 3) {
					grid.column(3);
				}
			}
		};

		// Set initial responsive state
		handleResize();

		// Use ResizeObserver to watch container size changes
		const resizeObserver = new ResizeObserver(handleResize);
		resizeObserver.observe(gridContainer);

		const cleanup = () => {
			resizeObserver.disconnect();
			grid?.destroy(false);
			grid = null;
		};

		return cleanup;
	});
</script>

<div class="grid-stack" bind:this={gridContainer}>
	{#each widgets as widget (widget.id)}
		<div
			class="grid-stack-item"
			data-gs-x={widget.x}
			data-gs-y={widget.y}
			data-gs-w={widget.w}
			data-gs-h={widget.h}
		>
			<div class="grid-stack-item-content">
				<TestWidget title={widget.title} color={widget.color} />
			</div>
		</div>
	{/each}
</div>

<style>
	.grid-stack-item-content {
		width: 100%;
		height: 100%;
		padding: 4px;
	}
</style>
