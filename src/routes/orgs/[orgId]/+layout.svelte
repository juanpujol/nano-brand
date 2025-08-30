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

<div>
	<header class="flex items-center justify-between border-b">
		<div class="w-full max-w-screen-xl mx-auto flex items-center justify-between p-4">
			<a href="/" class="flex items-center gap-2 font-medium">
				<div class="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
					<svg
						class="size-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width={2}
							d="M13 10V3L4 14h7v7l9-11h-7z"
						/>
					</svg>
				</div>
				NanoBrand
			</a>
		</div>
	</header>

	<svelte:boundary>
		<main>
			<div class="w-full max-w-screen-xl mx-auto p-4">
				{@render children?.()}
			</div>
		</main>

		{#snippet pending()}
			<div class="flex h-64 items-center justify-center">
				<div class="text-center">
					<div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
					<p class="text-muted-foreground">Loading...</p>
				</div>
			</div>
		{/snippet}
	</svelte:boundary>
</div>
