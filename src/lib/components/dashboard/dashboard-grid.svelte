<script lang="ts">
	import 'gridstack/dist/gridstack.min.css';
	import type { GridStack as GS, GridStackOptions } from 'gridstack';
	import GridWidgetWrapper from './grid-widget-wrapper.svelte';
	import type { DashboardWidget, DashboardGridConfig } from '$lib/types/dashboard';
	import { GridStack } from 'gridstack';

	interface Props {
		config: DashboardGridConfig;
		onConfigChange: (config: DashboardGridConfig) => void;
	}

	let { config, onConfigChange }: Props = $props();
	let gridContainer: HTMLDivElement | null = null;
	let grid: GS | null = null;

	// Initialize GridStack once after mount
	$effect(() => {
		if (!gridContainer) return;

		const gridOptions: GridStackOptions = {
			cellHeight: 250,
			margin: 0,
			column: 3,
			float: false // Widgets auto-float up to fill gaps
		};

		// Initialize GridStack with existing DOM elements
		grid = GridStack.init(gridOptions, gridContainer);

		// Handle responsive based on container width instead of window width
		const handleResize = () => {
			if (!grid || !gridContainer) return;
			const width = gridContainer.offsetWidth;
			if (width < 700) {
				// Mobile: 1 column
				if (grid.getColumn() !== 1) {
					grid.column(1, 'list');
				}
			} else if (width < 1024) {
				// Tablet: 2 columns
				if (grid.getColumn() !== 2) {
					grid.column(2, 'list');
				}
			} else {
				// Desktop: 3 columns
				if (grid.getColumn() !== 3) {
					grid.column(3, 'list');
				}
			}
		};

		// Set initial responsive state
		handleResize();

		// Use ResizeObserver to watch container size changes
		const resizeObserver = new ResizeObserver(handleResize);
		resizeObserver.observe(gridContainer);

		// Listen for resize events to update widget dimensions
		grid.on('resizestop', (event, el) => {
			if (!config.editMode) return;

			const widgetId =
				el.getAttribute('gs-id') || el.querySelector('[gs-id]')?.getAttribute('gs-id');
			const gsNode = el.gridstackNode;

			if (widgetId && gsNode) {
				const updatedWidgets = config.widgets.map((widget) =>
					widget.id === widgetId ? { ...widget, w: gsNode.w!, h: gsNode.h! } : widget
				);
				console.log('Widget resized:', widgetId, { w: gsNode.w, h: gsNode.h });
				onConfigChange({ ...config, widgets: updatedWidgets });
			}
		});

		// Listen for drag events to update widget positions
		grid.on('dragstop', (event, el) => {
			if (!config.editMode) return;

			const widgetId =
				el.getAttribute('gs-id') || el.querySelector('[gs-id]')?.getAttribute('gs-id');
			const gsNode = el.gridstackNode;

			if (widgetId && gsNode) {
				const updatedWidgets = config.widgets.map((widget) =>
					widget.id === widgetId ? { ...widget, x: gsNode.x!, y: gsNode.y! } : widget
				);
				console.log('Widget moved:', widgetId, { x: gsNode.x, y: gsNode.y });
				onConfigChange({ ...config, widgets: updatedWidgets });
			}
		});

		return () => {
			resizeObserver.disconnect();
			grid?.destroy(false);
			grid = null;
		};
	});

	// Update grid when config changes (especially edit mode)
	$effect(() => {
		if (!grid) return;

		// Keep consistent padding - use other visual cues for edit mode
		gridContainer?.style.setProperty('--widget-padding', '8px');

		// Instead of setStatic, just enable/disable interactions without layout changes
		if (config.editMode) {
			// Enable move and resize in edit mode
			grid.enableMove(true);
			grid.enableResize(true);
		} else {
			// Disable both move and resize in view mode
			grid.enableMove(false);
			grid.enableResize(false);
		}
	});

	export function addWidget(widget: DashboardWidget) {
		// Add to config first
		const newConfig = {
			...config,
			widgets: [...config.widgets, widget]
		};
		onConfigChange(newConfig);

		// Then add to GridStack after DOM updates
		if (grid) {
			// Use setTimeout to ensure DOM has updated
			setTimeout(() => {
				// Find the newly added DOM element
				const newElement = gridContainer?.querySelector(`[gs-id="${widget.id}"]`) as HTMLElement;
				if (newElement && grid) {
					// Add the element to GridStack
					grid.makeWidget(newElement);
				}
			}, 0);
		}
	}

	export function removeWidget(widgetId: string) {
		onConfigChange({
			...config,
			widgets: config.widgets.filter((w) => w.id !== widgetId)
		});
	}
</script>

<div class="dashboard-grid px-2" class:edit-mode={config.editMode}>
	<div class="grid-stack" bind:this={gridContainer}>
		{#each config.widgets as widget (widget.id)}
			<div
				class="grid-stack-item"
				{...{
					'gs-id': widget.id,
					'gs-x': widget.x,
					'gs-y': widget.y,
					'gs-w': widget.w,
					'gs-h': widget.h
				}}
			>
				<div class="grid-stack-item-content" class:edit-mode={config.editMode}>
					<GridWidgetWrapper {widget} />
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.dashboard-grid {
		width: 100%;
		height: 100%;
	}

	.dashboard-grid.edit-mode {
		background: var(--secondary);
	}

	/* Dashboard container styles */
	.edit-mode {
		background: hsl(var(--muted) / 0.05);
		border-radius: 12px;
	}

	.grid-stack {
		width: 100%;
	}

	.grid-stack-item {
		background: transparent;
	}

	/* Ensure grid items fill their allocated space completely */
	:global(.grid-stack > .grid-stack-item) {
		box-sizing: border-box;
	}

	.grid-stack-item-content {
		width: 100%;
		height: 100%;
		background: hsl(var(--card));
		border-radius: 8px;
		overflow: hidden;
		transition: all 0.2s ease;
	}

	/* Edit mode styles - when dragging is enabled */
	.edit-mode .grid-stack-item {
		cursor: move;
	}

	.grid-stack-item-content.edit-mode {
		border: 2px dashed hsl(var(--border));
	}

	.grid-stack-item-content.edit-mode:hover {
		border-color: hsl(var(--primary));
	}

	/* View mode styles - when dragging is disabled (GridStack adds .grid-stack-static) */
	:global(.grid-stack-static) .grid-stack-item {
		cursor: default !important;
	}

	/* Remove GridStack's default shadow during drag/resize */
	:global(.grid-stack-item.ui-draggable-dragging),
	:global(.grid-stack-item.ui-resizable-resizing) {
		box-shadow: none !important;
	}

	/* Style the GridStack resize handle to match our design */
	:global(.grid-stack-item > .ui-resizable-se) {
		width: 20px;
		height: 20px;
		right: 6px;
		bottom: 6px;
		background: hsl(var(--background) / 0.8);
		border-radius: 4px;
		backdrop-filter: blur(4px);
		cursor: nw-resize;
		z-index: 20;
		opacity: 0;
		transition: opacity 0.2s ease;
		/* Use our grip icon as background */
		background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='%236b7280' opacity='0.4'/%3E%3Ccircle cx='6' cy='2' r='1' fill='%236b7280' opacity='0.4'/%3E%3Ccircle cx='10' cy='2' r='1' fill='%236b7280' opacity='0.4'/%3E%3Ccircle cx='2' cy='6' r='1' fill='%236b7280' opacity='0.4'/%3E%3Ccircle cx='6' cy='6' r='1' fill='%236b7280' opacity='0.4'/%3E%3Ccircle cx='10' cy='6' r='1' fill='%236b7280' opacity='0.4'/%3E%3Ccircle cx='2' cy='10' r='1' fill='%236b7280' opacity='0.4'/%3E%3Ccircle cx='6' cy='10' r='1' fill='%236b7280' opacity='0.4'/%3E%3Ccircle cx='10' cy='10' r='1' fill='%236b7280' opacity='0.4'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: center;
	}

	/* Show resize handle only in edit mode */
	:global(.edit-mode .grid-stack-item > .ui-resizable-se) {
		opacity: 0.6;
	}

	:global(.edit-mode .grid-stack-item:hover > .ui-resizable-se) {
		opacity: 1;
	}

	/* Hide our visual indicator since GridStack handle now shows the grip */
	:global(.edit-mode .resize-handle-indicator) {
		display: none;
	}
</style>
