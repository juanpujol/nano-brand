<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import FitScoreBadge from '$lib/components/fit-score-badge.svelte';
	import {
		UserIcon,
		MailIcon,
		BuildingIcon,
		PhoneIcon,
		BriefcaseIcon,
		MapPinIcon,
		StarIcon,
		TagIcon
	} from '@lucide/svelte';
	import type { Lead } from '$lib/types/leads';

	interface Props {
		lead: Lead | null;
		title?: string;
	}

	let { lead, title = 'Informações principais' }: Props = $props();
</script>

<Card.Root class="gap-4">
	<Card.Header>
		<Card.Title class="text-base">{title}</Card.Title>
	</Card.Header>
	<Card.Content class="space-y-3">
		<div class="flex gap-3">
			<UserIcon class="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
			<div class="flex min-w-0 flex-col">
				<span class="text-sm font-medium text-muted-foreground">Nome</span>
				<p class="truncate text-sm">{lead?.name || '-'}</p>
			</div>
		</div>

		<div class="flex gap-3">
			<MailIcon class="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
			<div class="flex min-w-0 flex-col">
				<span class="text-sm font-medium text-muted-foreground">Email</span>
				<p class="truncate text-sm">{lead?.email || '-'}</p>
			</div>
		</div>

		<div class="flex gap-3">
			<BuildingIcon class="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
			<div class="flex min-w-0 flex-col">
				<span class="text-sm font-medium text-muted-foreground">Empresa</span>
				<p class="truncate text-sm">{lead?.company || '-'}</p>
			</div>
		</div>

		<div class="flex gap-3">
			<PhoneIcon class="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
			<div class="flex min-w-0 flex-col">
				<span class="text-sm font-medium text-muted-foreground">Telefone</span>
				<p class="truncate text-sm">{lead?.phone || '-'}</p>
			</div>
		</div>

		<div class="flex gap-3">
			<BriefcaseIcon class="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
			<div class="flex min-w-0 flex-col">
				<span class="text-sm font-medium text-muted-foreground">Cargo</span>
				<p class="truncate text-sm">{lead?.job_title || '-'}</p>
			</div>
		</div>

		<div class="flex gap-3">
			<MapPinIcon class="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
			<div class="flex min-w-0 flex-col">
				<span class="text-sm font-medium text-muted-foreground">Origem</span>
				<p class="truncate text-sm">{lead?.source || lead?.import_method || '-'}</p>
			</div>
		</div>

		{#if lead && lead.fit_score}
			<div class="flex gap-3">
				<StarIcon class="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
				<div class="flex min-w-0 flex-col">
					<span class="text-sm font-medium text-muted-foreground">Fit score</span>
					<div class="mt-1">
						<FitScoreBadge fitScore={lead?.fit_score} />
					</div>
				</div>
			</div>
		{/if}

		<div class="flex gap-3">
			<TagIcon class="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
			<div class="flex min-w-0 flex-col">
				<span class="text-sm font-medium text-muted-foreground">Tags</span>
				{#if lead?.tags && lead?.tags.length > 0}
					<div class="mt-1 flex flex-wrap gap-1">
						{#each lead?.tags || [] as tag, index (index)}
							<Badge variant="secondary" class="text-xs">
								{tag}
							</Badge>
						{/each}
					</div>
				{:else}
					<p class="text-sm">Sem tags</p>
				{/if}
			</div>
		</div>
	</Card.Content>
</Card.Root>
