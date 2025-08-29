<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { ChevronRightIcon } from '@lucide/svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { page } from '$app/state';
	import type { PageData } from './$types';
	import { FacebookIcon, GoogleAdsIcon, GoogleAnalyticsIcon } from '$lib/components/icons';
	import { WebhookIcon } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	// Organization data from parent layout
	const orgData = $derived(page.data);

	// Create dynamic integrations list based on data
	const integrations = $derived([
		{
			id: 'webhooks',
			title: 'Webhooks',
			description: 'Configure endpoints para receber notificações automáticas de eventos',
			icon: 'webhook',
			status: data.activeWebhooksCount > 0 ? 'connected' : 'not_connected',
			count: data.activeWebhooksCount,
			href: `/orgs/${page.params.orgId}/settings/integrations/webhooks`
		},
		{
			id: 'meta',
			title: 'Meta',
			description: 'Integração com Facebook e Instagram para campanhas e análises',
			icon: 'meta',
			status: 'not_connected',
			href: `/orgs/${page.params.orgId}/settings/integrations/meta`
		},
		{
			id: 'google-ads',
			title: 'Google Ads',
			description: 'Conecte suas campanhas do Google Ads para rastreamento de conversões',
			icon: 'google-ads',
			status: 'not_connected',
			href: `/orgs/${page.params.orgId}/settings/integrations/google-ads`
		},
		{
			id: 'google-analytics',
			title: 'Google Analytics',
			description: 'Importe dados de análise do seu site e aplicativo',
			icon: 'google-analytics',
			status: 'not_connected',
			href: `/orgs/${page.params.orgId}/settings/integrations/google-analytics`
		}
	]);

	function getStatusText(integration: (typeof integrations)[0]): string {
		if (integration.id === 'webhooks' && integration.count !== undefined) {
			if (integration.count > 0) {
				return `${integration.count} Conectado${integration.count !== 1 ? 's' : ''}`;
			}
			return 'Não conectado';
		}

		switch (integration.status) {
			case 'connected':
				return 'Conectado';
			case 'error':
				return 'Erro';
			default:
				return 'Não conectado';
		}
	}
</script>

<svelte:head>
	<title>Integrações | {orgData.currentOrganization?.name || 'Organização'} | Laiki</title>
</svelte:head>

<div class="mx-auto w-full max-w-7xl space-y-6 p-6">
	<!-- Page Header -->
	<div class="flex flex-col gap-4">
		<div>
			<h1 class="text-3xl font-semibold tracking-tight">Integrações</h1>
			<p class="text-muted-foreground">
				Conecte suas ferramentas e plataformas favoritas para importar dados de forma automática.
			</p>
		</div>
	</div>

	<!-- Integrations Grid -->
	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each integrations as integration (integration.id)}
			<Card.Root class="group cursor-pointer transition-all hover:shadow-md">
				<Card.Header>
					<div class="flex items-start justify-between">
						<div class="flex items-center space-x-4">
							<div class="flex-shrink-0">
								{#if integration.icon === 'webhook'}
									<div class="rounded-lg bg-green-100 p-3 text-black">
										<WebhookIcon class="h-8 w-8" />
									</div>
								{:else if integration.icon === 'meta'}
									<div class="rounded-lg bg-blue-100 p-3 text-[#0866FF]">
										<FacebookIcon class="h-8 w-8" />
									</div>
								{:else if integration.icon === 'google-ads'}
									<div class="rounded-lg bg-blue-100 p-3 text-[#4285F4]">
										<GoogleAdsIcon class="h-8 w-8" />
									</div>
								{:else if integration.icon === 'google-analytics'}
									<div class="rounded-lg bg-orange-100 p-3 text-[#E37400]">
										<GoogleAnalyticsIcon class="h-8 w-8" />
									</div>
								{/if}
							</div>
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<h3 class="text-lg font-semibold">{integration.title}</h3>
									<Badge variant="secondary" class="text-xs">
										{getStatusText(integration)}
									</Badge>
								</div>
								<p class="mt-2 text-sm text-muted-foreground">
									{integration.description}
								</p>
							</div>
						</div>
					</div>
				</Card.Header>
				<Card.Content>
					<Button class="w-full" variant="secondary" href={integration.href}>
						<span class="mr-2">Configurar</span>
						<ChevronRightIcon class="h-4 w-4 transition-transform group-hover:translate-x-1" />
					</Button>
				</Card.Content>
			</Card.Root>
		{/each}
	</div>

	<!-- Help Section -->
	<Card.Root class="mt-8">
		<Card.Header>
			<Card.Title>Precisa de ajuda?</Card.Title>
			<Card.Description>
				Encontre documentação e tutoriais sobre como configurar suas integrações
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="flex flex-col gap-2 sm:flex-row">
				<Button variant="outline" size="sm">Ver documentação</Button>
				<Button variant="outline" size="sm">Contatar suporte</Button>
			</div>
		</Card.Content>
	</Card.Root>
</div>
