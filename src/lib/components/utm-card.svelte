<script lang="ts">
	import * as Card from '$lib/components/ui/card';

	interface Props {
		title: string;
		utmSource: string | null;
		utmMedium: string | null;
		utmCampaign: string | null;
		utmTerm: string | null;
		utmContent: string | null;
	}

	let { title, utmSource, utmMedium, utmCampaign, utmTerm, utmContent }: Props = $props();
</script>

<Card.Root class="gap-4">
	<Card.Header>
		<Card.Title class="text-base">{title}</Card.Title>
	</Card.Header>
	<Card.Content class="space-y-3">
		<div>
			<span class="text-sm font-medium text-muted-foreground">Origem</span>
			<p class="text-sm">{utmSource || '-'}</p>
		</div>

		<div>
			<span class="text-sm font-medium text-muted-foreground">Mídia</span>
			<p class="text-sm">{utmMedium || '-'}</p>
		</div>

		<div>
			<span class="text-sm font-medium text-muted-foreground">Campanha</span>
			<p class="text-sm">{utmCampaign || '-'}</p>
		</div>

		<div>
			<span class="text-sm font-medium text-muted-foreground">Termo</span>
			<p class="text-sm">{utmTerm || '-'}</p>
		</div>

		<div>
			<span class="text-sm font-medium text-muted-foreground">Conteúdo</span>
			<p class="text-sm">{utmContent || '-'}</p>
		</div>
	</Card.Content>
</Card.Root>
