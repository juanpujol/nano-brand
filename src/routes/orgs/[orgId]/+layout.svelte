<script lang="ts">
	import OrgSidebar from '$lib/components/layout/org-sidebar';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Separator from '$lib/components/ui/separator';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import type { LayoutData } from './$types';
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { cn } from '$lib/utils/ui';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	// Track scroll position to show header border
	let scrollY = $state(0);
	let showHeaderBorder = $derived(scrollY > 0);

	$effect(() => {
		if (!browser) return;

		const main = document.querySelector('main');

		const handleScroll = (target: HTMLElement) => {
			scrollY = target.scrollTop;
		};

		if (main) {
			main.addEventListener('scroll', () => handleScroll(main), { passive: true });
		}

		return () => {
			if (main) {
				main.removeEventListener('scroll', () => handleScroll(main));
			}
		};
	});

	// Get current page info based on route
	const currentPageInfo = $derived(() => {
		const pathname = $page.url.pathname;
		if (pathname.includes('/conversions')) {
			return { title: 'Conversões', parentTitle: null, parentHref: null };
		}
		if (pathname.includes('/leads')) {
			return { title: 'Leads', parentTitle: null, parentHref: null };
		}
		if (pathname.includes('/custom-fields')) {
			return { title: 'Campos personalizados', parentTitle: null, parentHref: null };
		}
		if (pathname.includes('/segments/new')) {
			return {
				title: 'Nova segmentação',
				parentTitle: 'Segmentações',
				parentHref: `/orgs/${$page.params.orgId}/segments`
			};
		}
		if (pathname.includes('/segments/') && !pathname.endsWith('/segments')) {
			return {
				title: 'Editar segmentação',
				parentTitle: 'Segmentações',
				parentHref: `/orgs/${$page.params.orgId}/segments`
			};
		}
		if (pathname.includes('/segments')) {
			return { title: 'Segmentações', parentTitle: null, parentHref: null };
		}
		if (pathname.includes('/dash')) {
			return { title: 'Dashboard', parentTitle: null, parentHref: null };
		}
		if (pathname.includes('/settings/integrations/webhooks') && pathname.includes('/mapping')) {
			return {
				title: 'Mapeamento de campos',
				parentTitle: 'Webhook details',
				parentHref: `/orgs/${$page.params.orgId}/settings/integrations/webhooks/${$page.params.webhookId}`,
				grandparentTitle: 'Webhooks',
				grandparentHref: `/orgs/${$page.params.orgId}/settings/integrations/webhooks`,
				greatGrandparentTitle: 'Integrações',
				greatGrandparentHref: `/orgs/${$page.params.orgId}/settings/integrations`
			};
		}
		if (pathname.includes('/settings/integrations/webhooks') && !pathname.endsWith('/webhooks')) {
			return {
				title: 'Webhook details',
				parentTitle: 'Webhooks',
				parentHref: `/orgs/${$page.params.orgId}/settings/integrations/webhooks`,
				grandparentTitle: 'Integrações',
				grandparentHref: `/orgs/${$page.params.orgId}/settings/integrations`
			};
		}
		if (pathname.includes('/settings/integrations/webhooks')) {
			return {
				title: 'Webhooks',
				parentTitle: 'Integrações',
				parentHref: `/orgs/${$page.params.orgId}/settings/integrations`
			};
		}
		if (pathname.includes('/settings/integrations')) {
			return { title: 'Integrações', parentTitle: null, parentHref: null };
		}
		return { title: 'Relatórios', parentTitle: null, parentHref: null };
	});
</script>

<Sidebar.Provider>
	<OrgSidebar
		user={data.user}
		memberships={data.memberships}
		currentOrganization={data.currentOrganization}
	/>
	<Sidebar.Inset>
		<header
			class={cn(
				'sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 bg-background transition-all duration-200',
				showHeaderBorder && 'border-b border-border'
			)}
		>
			<div class="flex items-center gap-2 px-4">
				<Sidebar.Trigger class="-ml-1" />
				<Separator.Root orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
				<Breadcrumb.Root>
					<Breadcrumb.List>
						<!-- Desktop view: Full breadcrumb -->
						<div class="hidden md:contents">
							<Breadcrumb.Item>
								<Breadcrumb.Link href="/orgs/{data.currentOrganization?.id}">
									{data.currentOrganization?.name || 'Organization'}
								</Breadcrumb.Link>
							</Breadcrumb.Item>
							<Breadcrumb.Separator />

							{#if currentPageInfo().greatGrandparentTitle || (currentPageInfo().grandparentTitle && currentPageInfo().parentTitle)}
								<!-- Compact view: always show max 3 steps with dropdown in middle -->
								{#if currentPageInfo().greatGrandparentTitle}
									<!-- 4+ levels: org > ... > parent > current -->
									<Breadcrumb.Item>
										<DropdownMenu.Root>
											<DropdownMenu.Trigger class="flex items-center gap-1">
												<Breadcrumb.Ellipsis class="h-4 w-4" />
												<span class="sr-only">Toggle menu</span>
											</DropdownMenu.Trigger>
											<DropdownMenu.Content align="start">
												<DropdownMenu.Item>
													<a href={currentPageInfo().greatGrandparentHref} class="block w-full">
														{currentPageInfo().greatGrandparentTitle}
													</a>
												</DropdownMenu.Item>
												<DropdownMenu.Item>
													<a href={currentPageInfo().grandparentHref} class="block w-full">
														{currentPageInfo().grandparentTitle}
													</a>
												</DropdownMenu.Item>
											</DropdownMenu.Content>
										</DropdownMenu.Root>
									</Breadcrumb.Item>
									<Breadcrumb.Separator />
									<Breadcrumb.Item>
										<Breadcrumb.Link href={currentPageInfo().parentHref}>
											{currentPageInfo().parentTitle}
										</Breadcrumb.Link>
									</Breadcrumb.Item>
									<Breadcrumb.Separator />
								{:else if currentPageInfo().grandparentTitle && currentPageInfo().parentTitle}
									<!-- 3 levels: org > grandparent > parent > current, show grandparent in dropdown -->
									<Breadcrumb.Item>
										<DropdownMenu.Root>
											<DropdownMenu.Trigger class="flex items-center gap-1">
												<Breadcrumb.Ellipsis class="h-4 w-4" />
												<span class="sr-only">Toggle menu</span>
											</DropdownMenu.Trigger>
											<DropdownMenu.Content align="start">
												<DropdownMenu.Item>
													<a href={currentPageInfo().grandparentHref} class="block w-full">
														{currentPageInfo().grandparentTitle}
													</a>
												</DropdownMenu.Item>
											</DropdownMenu.Content>
										</DropdownMenu.Root>
									</Breadcrumb.Item>
									<Breadcrumb.Separator />
									<Breadcrumb.Item>
										<Breadcrumb.Link href={currentPageInfo().parentHref}>
											{currentPageInfo().parentTitle}
										</Breadcrumb.Link>
									</Breadcrumb.Item>
									<Breadcrumb.Separator />
								{/if}
							{:else}
								<!-- Standard view for 2 or fewer additional levels -->
								{#if currentPageInfo().grandparentTitle && currentPageInfo().grandparentHref}
									<Breadcrumb.Item>
										<Breadcrumb.Link href={currentPageInfo().grandparentHref}>
											{currentPageInfo().grandparentTitle}
										</Breadcrumb.Link>
									</Breadcrumb.Item>
									<Breadcrumb.Separator />
								{/if}
								{#if currentPageInfo().parentTitle && currentPageInfo().parentHref}
									<Breadcrumb.Item>
										<Breadcrumb.Link href={currentPageInfo().parentHref}>
											{currentPageInfo().parentTitle}
										</Breadcrumb.Link>
									</Breadcrumb.Item>
									<Breadcrumb.Separator />
								{/if}
							{/if}
						</div>

						<!-- Mobile view: Only dropdown + current page -->
						<div class="contents md:hidden">
							{#if currentPageInfo().parentTitle || currentPageInfo().grandparentTitle || currentPageInfo().greatGrandparentTitle}
								<Breadcrumb.Item>
									<DropdownMenu.Root>
										<DropdownMenu.Trigger class="flex items-center gap-1">
											<Breadcrumb.Ellipsis class="h-4 w-4" />
											<span class="sr-only">Toggle menu</span>
										</DropdownMenu.Trigger>
										<DropdownMenu.Content align="start">
											<DropdownMenu.Item>
												<a href="/orgs/{data.currentOrganization?.id}" class="block w-full">
													{data.currentOrganization?.name || 'Organization'}
												</a>
											</DropdownMenu.Item>
											{#if currentPageInfo().greatGrandparentTitle}
												<DropdownMenu.Item>
													<a href={currentPageInfo().greatGrandparentHref} class="block w-full">
														{currentPageInfo().greatGrandparentTitle}
													</a>
												</DropdownMenu.Item>
											{/if}
											{#if currentPageInfo().grandparentTitle}
												<DropdownMenu.Item>
													<a href={currentPageInfo().grandparentHref} class="block w-full">
														{currentPageInfo().grandparentTitle}
													</a>
												</DropdownMenu.Item>
											{/if}
											{#if currentPageInfo().parentTitle}
												<DropdownMenu.Item>
													<a href={currentPageInfo().parentHref} class="block w-full">
														{currentPageInfo().parentTitle}
													</a>
												</DropdownMenu.Item>
											{/if}
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								</Breadcrumb.Item>
								<Breadcrumb.Separator />
							{/if}
						</div>

						<Breadcrumb.Item>
							<Breadcrumb.Page>{currentPageInfo().title}</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</div>
		</header>

		<div class="flex flex-1 flex-col pt-0">
			<svelte:boundary>
				{@render children?.()}

				{#snippet pending()}
					<div class="flex h-64 items-center justify-center">
						<div class="text-center">
							<div
								class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
							></div>
							<p class="text-muted-foreground">Carregando...</p>
						</div>
					</div>
				{/snippet}
			</svelte:boundary>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>

<!-- <div class="flex flex-1 flex-col pt-0">
	<svelte:boundary>
		{@render children?.()}

		{#snippet pending()}
			<div class="flex h-64 items-center justify-center">
				<div class="text-center">
					<div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
					<p class="text-muted-foreground">Carregando...</p>
				</div>
			</div>
		{/snippet}
	</svelte:boundary>
</div> -->
