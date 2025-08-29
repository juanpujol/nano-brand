<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		PlugIcon,
		SearchIcon,
		PlusIcon,
		ChevronLeftIcon,
		ChevronRightIcon,
		WebhookIcon
	} from '@lucide/svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import CreateWebhookDialog from './create-webhook-dialog.svelte';
	import { Badge } from '$lib/components/ui/badge';

	let { data }: { data: PageData } = $props();

	// Organization data from parent layout
	const orgData = $derived(page.data);

	// Search state
	let searchTerm = $state(page.url.searchParams.get('search') || '');
	let searchTimeout: ReturnType<typeof setTimeout>;

	// Dialog state
	let isCreateDialogOpen = $state(false);

	// Search function with debounce
	function handleSearch() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			const url = new URL(page.url);
			if (searchTerm.trim()) {
				url.searchParams.set('search', searchTerm.trim());
			} else {
				url.searchParams.delete('search');
			}
			url.searchParams.set('page', '1'); // Reset to first page on search
			goto(url.toString(), {
				keepFocus: true,
				noScroll: true
			});
		}, 500); // 500ms debounce
	}

	// Handle navigation for pagination
	function handlePageChange(newPage: number) {
		const url = new URL(page.url);
		url.searchParams.set('page', String(newPage));
		goto(url.toString(), {
			keepFocus: true,
			noScroll: true
		});
	}

	// Handle creating new webhook
	function handleCreateWebhook() {
		isCreateDialogOpen = true;
	}

	const totalPages = $derived(data.totalPages || 1);
	const canPreviousPage = $derived((data.page || 1) > 1);
	const canNextPage = $derived((data.page || 1) < (data.totalPages || 1));
	const currentPage = $derived(data.page || 1);
</script>

<svelte:head>
	<title>Webhooks | {orgData.currentOrganization?.name || 'Organização'} | Laiki</title>
</svelte:head>

<div class="mx-auto w-full max-w-4xl space-y-6 p-6">
	<!-- Page Header -->
	<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
		<div>
			<h1 class="text-3xl font-semibold tracking-tight">Webhooks</h1>
			<p class="text-muted-foreground">
				{data.total} webhook{data.total !== 1 ? 's' : ''} encontrado{data.total !== 1 ? 's' : ''}
			</p>
		</div>
		<div class="flex flex-col gap-2 md:flex-row md:items-center">
			<div class="relative">
				<SearchIcon
					class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
				/>
				<Input
					type="text"
					placeholder="Buscar por nome ou descrição..."
					bind:value={searchTerm}
					oninput={handleSearch}
					class="w-full pl-9 md:w-64"
				/>
			</div>
			<div>
				<Button onclick={handleCreateWebhook} class="shrink-0">
					<PlusIcon class="mr-2 h-4 w-4" />
					Novo webhook
				</Button>
			</div>
		</div>
	</div>

	<!-- Webhooks List -->
	{#if data.webhooks && data.webhooks.length > 0}
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<WebhookIcon class="h-5 w-5" />
					Webhooks configurados
				</Card.Title>
				<Card.Description>
					Configure endpoints para receber notificações automáticas de eventos
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="overflow-clip rounded-xl border bg-background dark:bg-background/50">
					{#each data.webhooks as webhook (webhook.id)}
						<div class="group relative">
							<a
								href="/orgs/{page.params.orgId}/settings/integrations/webhooks/{webhook.id}"
								title="Modificar webhook"
								class="block w-full rounded-none border-b p-4 text-sm no-underline transition-none group-last:border-b-0 hover:bg-accent hover:!no-underline focus-visible:bg-accent focus-visible:ring-0"
							>
								<div class="flex items-start">
									<div class="flex-grow">
										<p class="flex items-center gap-1 text-base font-medium">
											{webhook.name}
										</p>
										<p class="text-muted-foreground">
											{webhook.description}
										</p>
									</div>
									<div class="flex items-center gap-1 self-center">
										<Badge variant={webhook.is_active ? 'default' : 'secondary'}>
											{webhook.is_active ? 'Ativo' : 'Inativo'}
										</Badge>
										<ChevronRightIcon class="text-muted-foreground" />
									</div>
								</div>
							</a>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<div class="text-center text-sm text-muted-foreground md:text-left">
					Página {currentPage} de {totalPages} • {data.total} webhook{data.total !== 1 ? 's' : ''} no
					total
				</div>
				<div class="flex items-center justify-center space-x-2 md:justify-end">
					<Button
						variant="outline"
						size="sm"
						onclick={() => handlePageChange(currentPage - 1)}
						disabled={!canPreviousPage}
						class="flex-shrink-0"
					>
						<ChevronLeftIcon class="h-4 w-4" />
						<span class="hidden sm:inline">Anterior</span>
					</Button>
					<div class="flex items-center space-x-1 text-sm">
						<span class="hidden sm:inline">Página</span>
						<span class="font-medium">{currentPage}</span>
						<span>de</span>
						<span class="font-medium">{totalPages}</span>
					</div>
					<Button
						variant="outline"
						size="sm"
						onclick={() => handlePageChange(currentPage + 1)}
						disabled={!canNextPage}
						class="flex-shrink-0"
					>
						<span class="hidden sm:inline">Próxima</span>
						<ChevronRightIcon class="h-4 w-4" />
					</Button>
				</div>
			</div>
		{/if}
	{:else}
		<!-- Empty State -->
		<Card.Root class="py-12 text-center">
			<Card.Content>
				<div class="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
					<PlugIcon class="h-12 w-12 text-muted-foreground" />
				</div>
				<h3 class="mb-2 text-lg font-semibold">Nenhum webhook configurado</h3>
				<p class="mx-auto mb-6 max-w-md text-muted-foreground">
					{#if searchTerm}
						Nenhum webhook encontrado para "{searchTerm}". Tente ajustar sua pesquisa.
					{:else}
						Configure webhooks para receber notificações automáticas quando eventos importantes
						acontecerem em sua organização.
					{/if}
				</p>
				{#if !searchTerm}
					<Button onclick={handleCreateWebhook}>
						<PlusIcon class="mr-2 h-4 w-4" />
						Criar primeiro webhook
					</Button>
				{/if}
			</Card.Content>
		</Card.Root>
	{/if}
</div>

<!-- Create Webhook Dialog -->
{#if data.createForm}
	<CreateWebhookDialog
		bind:open={isCreateDialogOpen}
		createForm={data.createForm}
		formAction="?/create"
	/>
{/if}
