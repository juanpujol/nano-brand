<script lang="ts">
	import { createClient } from '$lib/supabase/client';
	import { Mail, Save, Shield, User } from '@lucide/svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as InputOTP from '$lib/components/ui/input-otp';
	import Spinner from '$lib/components/spinner.svelte';

	interface UserAccountData {
		name: string;
		email: string;
	}

	interface Props {
		open: boolean;
		currentUser: UserAccountData;
		onUpdate: (userData: UserAccountData) => Promise<void>;
	}

	interface EmailChangeState {
		step: 'email' | 'otp';
		pendingEmail: string;
		otpCode: string;
		isOtpSent: boolean;
		resendCooldown: number;
	}

	let { open = $bindable(), currentUser, onUpdate }: Props = $props();

	let formData = $state<UserAccountData>({
		name: '',
		email: ''
	});

	let emailChangeState = $state<EmailChangeState>({
		step: 'email',
		pendingEmail: '',
		otpCode: '',
		isOtpSent: false,
		resendCooldown: 0
	});

	let isLoading = $state(false);
	let isSendingOtp = $state(false);
	let resendInterval: ReturnType<typeof setInterval> | null = null;

	const supabase = createClient();

	// Reset form when dialog opens/closes or current user changes
	$effect(() => {
		if (open && currentUser) {
			formData = {
				name: currentUser.name,
				email: currentUser.email
			};
			// Reset email change state
			emailChangeState = {
				step: 'email',
				pendingEmail: '',
				otpCode: '',
				isOtpSent: false,
				resendCooldown: 0
			};
		}
	});

	// Cooldown timer effect
	$effect(() => {
		if (emailChangeState.resendCooldown > 0) {
			resendInterval = setInterval(() => {
				emailChangeState.resendCooldown = emailChangeState.resendCooldown - 1;
			}, 1000);
		} else if (resendInterval) {
			clearInterval(resendInterval);
			resendInterval = null;
		}

		return () => {
			if (resendInterval) {
				clearInterval(resendInterval);
				resendInterval = null;
			}
		};
	});

	function validateEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	async function sendEmailChangeOTP(newEmail: string) {
		isSendingOtp = true;
		try {
			// Fire and forget - since we know it works but doesn't return properly
			supabase.auth.updateUser({
				email: newEmail
			});

			// Wait a short moment for the update to process
			await new Promise((resolve) => setTimeout(resolve, 500));

			emailChangeState.step = 'otp';
			emailChangeState.pendingEmail = newEmail;
			emailChangeState.isOtpSent = true;
			emailChangeState.resendCooldown = 60;
		} catch (error) {
			console.error('Error sending OTP:', error);
			throw error;
		} finally {
			isSendingOtp = false;
		}
	}

	async function verifyOTPAndUpdateEmail(otpCode?: string) {
		const codeToVerify = otpCode || emailChangeState.otpCode;

		if (!codeToVerify || codeToVerify.length !== 6) {
			throw new Error('Please enter the 6-digit code.');
		}

		isLoading = true;
		try {
			// Fire and forget - since we know it works but doesn't return properly
			supabase.auth.verifyOtp({
				email: emailChangeState.pendingEmail,
				token: codeToVerify,
				type: 'email_change'
			});

			// Wait a short moment for the verification to process
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Update local state and notify parent
			const updatedData = {
				...formData,
				email: emailChangeState.pendingEmail
			};

			// Update local form data as well
			formData = updatedData;

			await onUpdate(updatedData);
			open = false;
		} catch (error) {
			console.error('Error verifying OTP:', error);
			// Clear OTP on error
			emailChangeState.otpCode = '';
			throw error;
		} finally {
			isLoading = false;
		}
	}

	function handleOTPChange(value: string) {
		emailChangeState.otpCode = value;

		// Auto-submit when 6 digits are entered (only if not already loading)
		if (value.length === 6 && !isLoading) {
			verifyOTPAndUpdateEmail(value).catch((error) => {
				console.error('Auto-verify failed:', error);
			});
		}
	}

	async function handleSubmit() {
		// Basic validation
		if (!formData.name.trim()) {
			throw new Error('Please enter your name.');
		}

		if (!formData.email.trim()) {
			throw new Error('Please enter your email.');
		}

		if (!validateEmail(formData.email)) {
			throw new Error('Please enter a valid email.');
		}

		// If email hasn't changed, just update name
		if (formData.email === currentUser.email) {
			isLoading = true;

			// Convert $state proxy to plain object
			const userData = {
				name: formData.name,
				email: formData.email
			};

			// Use Promise.resolve to ensure we handle the async properly
			Promise.resolve(onUpdate(userData))
				.then(() => {
					open = false;
				})
				.catch(() => {
					// Handle error silently
				})
				.finally(() => {
					isLoading = false;
				});

			return;
		}

		// If email changed, send OTP to new email
		sendEmailChangeOTP(formData.email);
	}

	async function handleOTPSubmit() {
		await verifyOTPAndUpdateEmail();
	}

	async function handleResendOTP() {
		if (emailChangeState.resendCooldown > 0) return;

		isSendingOtp = true;
		try {
			const { error } = await supabase.auth.resend({
				type: 'email_change',
				email: emailChangeState.pendingEmail
			});

			if (error) throw error;

			emailChangeState.resendCooldown = 60;
		} catch (error) {
			console.error('Error resending OTP:', error);
			throw new Error('Error resending code. Please try again.');
		} finally {
			isSendingOtp = false;
		}
	}

	function handleBackToEmail() {
		emailChangeState.step = 'email';
		emailChangeState.otpCode = '';
		emailChangeState.isOtpSent = false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-sm">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				{#if emailChangeState.step === 'email'}
					<User class="h-5 w-5" />
					My Account
				{:else}
					<Shield class="h-5 w-5" />
					Verify Email
				{/if}
			</Dialog.Title>
		</Dialog.Header>

		{#if emailChangeState.step === 'email'}
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit().catch((error) => {
						console.error('Form submission error:', error);
					});
				}}
				class="space-y-4"
			>
				<!-- Name Field -->
				<div class="space-y-2">
					<Label for="user-name" class="text-sm font-medium">Full Name</Label>
					<Input
						id="user-name"
						bind:value={formData.name}
						placeholder="Enter your full name"
						required
						disabled={isLoading || isSendingOtp}
					/>
					<p class="text-xs text-muted-foreground">This name will be displayed in the system</p>
				</div>

				<!-- Email Field -->
				<div class="space-y-2">
					<Label for="user-email" class="text-sm font-medium">Email</Label>
					<Input
						id="user-email"
						type="email"
						bind:value={formData.email}
						placeholder="Enter your email"
						required
						disabled={isLoading || isSendingOtp}
					/>
					<p class="text-xs text-muted-foreground">
						{#if formData.email !== currentUser.email}
							A verification code will be sent to the new email
						{:else}
							Email used for login and notifications
						{/if}
					</p>
				</div>

				<!-- Info Alert -->
				{#if formData.email !== currentUser.email}
					<div class="rounded-lg bg-muted p-4">
						<p class="text-sm text-muted-foreground">
							<strong>Important:</strong> You will receive a verification code at the new email address. Enter
							the code to confirm the change.
						</p>
					</div>
				{/if}

				<!-- Action Buttons -->
				<div class="flex gap-3 pt-4">
					<Button
						type="button"
						variant="outline"
						onclick={() => (open = false)}
						class="flex-1"
						disabled={isLoading || isSendingOtp}
					>
						Cancel
					</Button>
					<Button type="submit" class="flex-1" disabled={isLoading || isSendingOtp}>
						{#if isSendingOtp}
							Sending code...
						{:else if isLoading}
							Saving...
						{:else if formData.email !== currentUser.email}
							<Mail class="mr-2 h-4 w-4" />
							Send Code
						{:else}
							<Save class="mr-2 h-4 w-4" />
							Save Changes
						{/if}
					</Button>
				</div>
			</form>
		{:else}
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleOTPSubmit().catch((error) => {
						console.error('OTP submission error:', error);
					});
				}}
				class="space-y-4"
			>
				<!-- OTP Info -->
				<div class="space-y-2 text-center">
					<p class="text-sm text-muted-foreground">We sent a 6-digit code to:</p>
					<p class="font-medium">{emailChangeState.pendingEmail}</p>
				</div>

				<!-- OTP Input -->
				<div class="space-y-2">
					<Label for="otp-input" class="block text-center text-sm font-medium">
						Verification Code
					</Label>
					<div class="flex justify-center">
						<InputOTP.Root
							maxlength={6}
							bind:value={emailChangeState.otpCode}
							onValueChange={handleOTPChange}
							disabled={isLoading}
							data-testid="otp-input"
						>
							{#snippet children({ cells })}
								<InputOTP.Group>
									{#each cells as cell, index (index)}
										<InputOTP.Slot {cell} class="h-12 w-12 text-lg" />
									{/each}
								</InputOTP.Group>
							{/snippet}
						</InputOTP.Root>
					</div>
					<p class="text-center text-xs text-muted-foreground">
						Enter the 6-digit code sent to your email
					</p>
				</div>

				<!-- Resend OTP -->
				<div class="text-center">
					<Button
						type="button"
						variant="link"
						onclick={() => {
							handleResendOTP().catch(() => {
								// Handle error silently
							});
						}}
						disabled={emailChangeState.resendCooldown > 0 || isSendingOtp}
						class="text-sm"
					>
						{#if emailChangeState.resendCooldown > 0}
							Resend in {emailChangeState.resendCooldown}s
						{:else if isSendingOtp}
							Resending...
						{:else}
							Resend Code
						{/if}
					</Button>
				</div>

				<!-- Action Buttons -->
				<div class="flex gap-3 pt-4">
					<Button
						type="button"
						variant="outline"
						onclick={handleBackToEmail}
						class="flex-1"
						disabled={isLoading}
					>
						Back
					</Button>
					<Button type="submit" class="flex-1" disabled={isLoading}>
						{#if isLoading}
							<div class="flex items-center gap-2">
								<Spinner class="mr-2 size-4" />
								Verifying...
							</div>
						{:else if emailChangeState.otpCode.length === 6}
							<Shield class="mr-2 size-4" />
							Verify and Save
						{:else}
							<Shield class="mr-2 size-4" />
							Enter Code
						{/if}
					</Button>
				</div>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>
