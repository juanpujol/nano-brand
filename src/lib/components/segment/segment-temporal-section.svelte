<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import { Label } from '$lib/components/ui/label';
	import * as Popover from '$lib/components/ui/popover';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Calendar } from '$lib/components/ui/calendar';
	import { CalendarIcon } from '@lucide/svelte';
	import type { TimeFilterType, RelativePeriodValue } from '$lib/types/segments';
	import { TIME_FILTER_OPTIONS, RELATIVE_PERIOD_OPTIONS } from '$lib/types/segment-forms';
	import { DateFormatter, type DateValue, getLocalTimeZone } from '@internationalized/date';
	import { cn } from '$lib/utils/ui';

	interface Props {
		timeFilterType: TimeFilterType;
		relativeValue: RelativePeriodValue;
		startDate?: DateValue;
		endDate?: DateValue;
		onTimeFilterChange: (timeFilterType: TimeFilterType) => void;
		onRelativeValueChange: (relativeValue: RelativePeriodValue) => void;
		onDateChange?: (startDate?: DateValue, endDate?: DateValue) => void;
	}

	let {
		timeFilterType,
		relativeValue,
		startDate,
		endDate,
		onTimeFilterChange,
		onRelativeValueChange,
		onDateChange
	}: Props = $props();

	const df = new DateFormatter('pt-BR', {
		dateStyle: 'medium'
	});

	const selectedPeriodLabel = $derived(
		TIME_FILTER_OPTIONS.find((p) => p.value === timeFilterType)?.label ||
			'Qualquer conversão no período'
	);

	const selectedRelativePeriodLabel = $derived(
		RELATIVE_PERIOD_OPTIONS.find((p) => p.value === relativeValue)?.label || 'Últimos 30 dias'
	);
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Filtro temporal</Card.Title>
	</Card.Header>
	<Card.Content class="grid grid-cols-1 gap-4 space-y-4 sm:grid-cols-2">
		<div class="space-y-2">
			<Label for="time-filter-type">Filtrar por</Label>
			<Select.Root
				type="single"
				value={timeFilterType}
				onValueChange={(value: string | undefined) => {
					if (value) onTimeFilterChange(value as TimeFilterType);
				}}
			>
				<Select.Trigger class="w-full">
					{selectedPeriodLabel}
				</Select.Trigger>
				<Select.Content>
					{#each TIME_FILTER_OPTIONS as period (period.value)}
						<Select.Item value={period.value}>{period.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
		<div class="space-y-2">
			<Label for="relative-period">Período</Label>
			<Select.Root
				type="single"
				value={relativeValue}
				onValueChange={(value: string | undefined) => {
					if (value) onRelativeValueChange(value as RelativePeriodValue);
				}}
			>
				<Select.Trigger class="w-full">
					{selectedRelativePeriodLabel}
				</Select.Trigger>
				<Select.Content>
					{#each RELATIVE_PERIOD_OPTIONS as period (period.value)}
						<Select.Item value={period.value}>{period.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>

		{#if (relativeValue as string) === 'absolute'}
			<div class="col-span-1 space-y-4 sm:col-span-2">
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<Label>Data de Início</Label>
						<Popover.Root>
							<Popover.Trigger
								class={cn(
									buttonVariants({ variant: 'outline' }),
									'w-full justify-start text-left font-normal',
									!startDate && 'text-muted-foreground'
								)}
							>
								<CalendarIcon class="mr-2 h-4 w-4" />
								{startDate ? df.format(startDate.toDate(getLocalTimeZone())) : 'Selecionar data'}
							</Popover.Trigger>
							<Popover.Content class="w-auto p-0" align="start">
								<Calendar
									type="single"
									bind:value={startDate}
									onValueChange={(date) => {
										if (onDateChange) {
											onDateChange(date, endDate);
										}
									}}
								/>
							</Popover.Content>
						</Popover.Root>
					</div>
					<div class="space-y-2">
						<Label>Data de Fim</Label>
						<Popover.Root>
							<Popover.Trigger
								class={cn(
									buttonVariants({ variant: 'outline' }),
									'w-full justify-start text-left font-normal',
									!endDate && 'text-muted-foreground'
								)}
							>
								<CalendarIcon class="mr-2 h-4 w-4" />
								{endDate ? df.format(endDate.toDate(getLocalTimeZone())) : 'Selecionar data'}
							</Popover.Trigger>
							<Popover.Content class="w-auto p-0" align="start">
								<Calendar
									type="single"
									bind:value={endDate}
									onValueChange={(date) => {
										if (onDateChange) {
											onDateChange(startDate, date);
										}
									}}
								/>
							</Popover.Content>
						</Popover.Root>
					</div>
				</div>
			</div>
		{/if}
	</Card.Content>
</Card.Root>
