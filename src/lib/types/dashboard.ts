import type { GridStackWidget } from 'gridstack';

export type WidgetType = 'counter' | 'series-chart' | 'test' | 'table' | 'pie';

export type WidgetSize = {
	w: number; // width in grid columns (1-3)
	h: number; // height in grid units (1=250px, 2=500px, 3=750px)
};

export interface DashboardWidget extends GridStackWidget {
	id: string;
	type: WidgetType;
	x: number;
	y: number;
	w: number;
	h: number;
	props?: Record<string, unknown>;
}

// Base interface for all widget props
export interface BaseWidgetProps {
	title?: string;
	description?: string;
	data?: unknown;
	period?: {
		label: string;
		start: Date;
		end: Date;
	};
}

export interface CounterWidgetProps extends BaseWidgetProps {
	data?: {
		value: number;
		formatted?: string;
		trend?: 'up' | 'down' | 'stable';
	};
	icon?: 'trending-down' | 'trending-up' | 'dollar-sign' | 'question';
	iconColor?: string;
}

export interface PieWidgetProps extends BaseWidgetProps {
	data?: Array<{
		key: string;
		value: number;
		label: string;
		color?: string;
	}>;
	variant?: 'pie' | 'donut';
	showLegend?: boolean;
}

export interface SeriesChartWidgetProps extends BaseWidgetProps {
	variant?: 'area' | 'line' | 'bar';
	series?: Array<{
		key: string;
		label: string;
		color?: string;
	}>;
}

export interface TableWidgetProps extends BaseWidgetProps {
	data?: Record<string, unknown>[];
	pageSize?: number;
	showPagination?: boolean;
}

export interface TestWidgetProps extends BaseWidgetProps {
	color?: string;
}

export interface DashboardGridConfig {
	editMode: boolean;
	widgets: DashboardWidget[];
}

export const WIDGET_DEFAULTS: Record<WidgetType, WidgetSize> = {
	counter: { w: 1, h: 1 }, // 1 col × 250px
	'series-chart': { w: 3, h: 2 }, // 3 cols × 500px
	test: { w: 2, h: 1 }, // 2 cols × 250px
	table: { w: 3, h: 2 }, // 3 cols × 500px
	pie: { w: 2, h: 2 } // 2 cols × 500px
};

export const GRID_CONFIG = {
	cellHeight: 250,
	margin: 16,
	column: 3,
	responsive: {
		breakpointForWindow: true,
		breakpoints: [
			{ w: 0, col: 1 }, // mobile
			{ w: 768, col: 2 }, // tablet
			{ w: 1280, col: 3 } // desktop
		]
	}
} as const;
