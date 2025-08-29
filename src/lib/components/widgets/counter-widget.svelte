<script lang="ts">
	import { TrendingDown, TrendingUp, DollarSign, CircleQuestionMark } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';

	import type { CounterWidgetProps } from '$lib/types/dashboard';

	type Props = CounterWidgetProps;

	let {
		title = 'Total revenue',
		description = 'Todos os leads',
		data = { value: 1200, formatted: 'R$ 1.200,00' },
		period = { label: 'Período: Automático', start: new Date(), end: new Date() },
		icon = 'trending-down',
		iconColor = 'text-red-500'
	}: Props = $props();

	const displayValue = $derived(data?.formatted || data?.value?.toLocaleString() || '0');
	const displayPeriod = $derived(period?.label || '');

	const iconComponents = {
		'trending-down': TrendingDown,
		'trending-up': TrendingUp,
		'dollar-sign': DollarSign,
		question: CircleQuestionMark
	};

	const IconComponent = iconComponents[icon];
</script>

<Card.Root class="@container/card flex h-full w-full flex-col justify-between p-4">
	<div class="flex justify-between">
		<div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
			<IconComponent class="size-4 {iconColor}" />
			<span>{title}</span>
		</div>
		<Button variant="ghost" size="icon" class="h-8 w-8">
			<CircleQuestionMark class="size-4" />
		</Button>
	</div>
	<div
		class="grid flex-1 items-center gap-2 text-center text-3xl font-semibold text-foreground tabular-nums @[250px]/card:text-3xl"
	>
		<span>{displayValue}</span>
	</div>
	<div class="flex-col items-start gap-1.5 text-sm">
		<div class="line-clamp-1 flex gap-2 font-medium">{description}</div>
		<div class="text-muted-foreground">{displayPeriod}</div>
	</div>
</Card.Root>
