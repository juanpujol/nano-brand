<script lang="ts">
	import OrgSwitcher from './org-switcher.svelte';
	import NavMain from './nav-main.svelte';
	import SidebarNavUser from './sidebar-nav-user.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { useSidebar } from '$lib/components/ui/sidebar';
	import type { User } from '@supabase/supabase-js';
	import type { ComponentProps } from 'svelte';
	import Brand from '$lib/components/layout/brand.svelte';

	interface Organization {
		id: string;
		name: string;
		created_at: string;
		updated_at: string;
	}

	interface Membership {
		id: string;
		organization_id: string;
		profile_id: string;
		role: 'admin' | 'member';
		created_at: string;
		organizations?: Organization;
	}

	interface Props {
		user: User;
		memberships: Membership[];
		currentOrganization?: Organization;
	}

	let {
		user,
		memberships,
		currentOrganization,
		ref = $bindable(null),
		variant = 'inset',
		collapsible = 'icon',
		...restProps
	}: Props & ComponentProps<typeof Sidebar.Root> = $props();

	// Get sidebar state to control brand positioning
	const sidebar = useSidebar();

	// Navigation items for the sidebar
	const mainNavItems = [
		{
			title: 'Relatórios',
			url: currentOrganization ? `/orgs/${currentOrganization.id}` : '/',
			icon: 'ChartBar'
		},
		{
			title: 'Leads',
			url: currentOrganization ? `/orgs/${currentOrganization.id}/leads` : '/leads',
			icon: 'Users'
		},
		{
			title: 'Conversões',
			url: currentOrganization ? `/orgs/${currentOrganization.id}/conversions` : '/conversions',
			icon: 'TrendingUp'
		},
		{
			title: 'Segmentações',
			url: currentOrganization ? `/orgs/${currentOrganization.id}/segments` : '/segments',
			icon: 'ListFilter'
		},
		{
			title: 'Campos personalizados',
			url: currentOrganization ? `/orgs/${currentOrganization.id}/custom-fields` : '/custom-fields',
			icon: 'Settings2'
		}
	];

	const configNavItems = [
		{
			title: 'Organização',
			url: currentOrganization
				? `/orgs/${currentOrganization.id}/configuracoes/organizacao`
				: '/configuracoes/organizacao',
			icon: 'Building2'
		},
		{
			title: 'Usuários',
			url: currentOrganization
				? `/orgs/${currentOrganization.id}/configuracoes/usuarios`
				: '/configuracoes/usuarios',
			icon: 'UserCog'
		},
		{
			title: 'Lead scoring',
			url: currentOrganization
				? `/orgs/${currentOrganization.id}/configuracoes/scoring`
				: '/configuracoes/scoring',
			icon: 'Target'
		},
		{
			title: 'Integrações',
			url: currentOrganization
				? `/orgs/${currentOrganization.id}/settings/integrations`
				: '/settings/integrations',
			icon: 'Plug'
		}
	];
</script>

<Sidebar.Root {variant} {collapsible} {...restProps} bind:ref>
	<Sidebar.Header>
		<OrgSwitcher {memberships} {currentOrganization} />
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={mainNavItems} hideLabel />
		<NavMain items={configNavItems} groupLabel="Configurações" />
	</Sidebar.Content>
	<Sidebar.Footer>
		<div
			class="opacity-30 transition-all {sidebar.state === 'collapsed'
				? '-translate-x-1 scale-[0.8]'
				: 'translate-x-2'}"
		>
			<Brand />
		</div>
		<SidebarNavUser {user} />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
