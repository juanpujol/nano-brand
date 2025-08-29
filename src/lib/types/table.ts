export interface TableRowData {
	id: string;
	client: string;
	amount: number;
	status: 'pago' | 'pendente' | 'vencido' | 'cancelado';
	date: string;
	category: 'Consultoria' | 'Desenvolvimento' | 'Design' | 'Marketing';
}

export interface TableWidgetProps {
	data: TableRowData[];
	columns?: string[];
	pageSize?: number;
	showPagination?: boolean;
}

export interface TableColumn {
	key: keyof TableRowData;
	label: string;
	sortable?: boolean;
	format?: (value: unknown) => string;
}
