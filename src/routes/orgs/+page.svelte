<script lang="ts">
	import { goto } from '$app/navigation';
	import { Building } from 'lucide-svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function selectOrganization(orgId: string) {
		goto(`/orgs/${orgId}`);
	}

	function createNewOrganization() {
		goto('/auth/new-org');
	}
</script>

<div class="min-h-screen bg-muted p-4 dark:bg-background">
	<div class="mx-auto max-w-4xl pt-16">
		<div class="mb-8 text-center">
			<div
				class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600"
			>
				<Building class="h-8 w-8 text-white" />
			</div>
			<h1 class="mb-2 text-3xl font-bold text-foreground">Selecione uma organização</h1>
			<p class="text-muted-foreground">Escolha a organização que você deseja acessar</p>
		</div>

		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each data.memberships as membership (membership.id)}
				{@const org = membership.organizations}
				{#if org}
					<Card class="cursor-pointer transition-shadow hover:shadow-md">
						<CardHeader class="pb-3">
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<CardTitle class="text-lg">{org.name}</CardTitle>
									<CardDescription class="mt-1">
										{membership.role === 'admin' ? 'Administrador' : 'Membro'}
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<Button
								class="w-full"
								onclick={(e) => {
									e.stopPropagation();
									selectOrganization(org.id);
								}}
							>
								Acessar organização
							</Button>
						</CardContent>
					</Card>
				{/if}
			{/each}
		</div>

		<div class="mt-8 text-center">
			<Button variant="outline" onclick={createNewOrganization}>
				<Building class="mr-2 h-4 w-4" />
				Criar nova organização
			</Button>
		</div>
	</div>
</div>
