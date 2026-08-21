'use client';

import ConfirmationDialog from '@/components/feedback/confirmation-dialog';
import { TokenQrDialog } from '@/components/users/token-qr-dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { Head, usePage } from '@inertiajs/react';
import { CreditCard, Home, Key, RefreshCw, Shield, User } from 'lucide-react';
import { useProfileForm } from '@/components/users/profile/use-profile-form';
import { ProfileGeneralTab } from '@/components/users/profile/profile-general-tab';
import { ProfileAddressTab } from '@/components/users/profile/profile-address-tab';
import { ProfileSecurityTab } from '@/components/users/profile/profile-security-tab';
import { ProfileApiTokensTab } from '@/components/users/profile/profile-api-tokens-tab';

export default function EnhancedProfileSettings() {
    const { t } = useTranslation();
    const { tokens, attributes, currentShipping, currentBilling } = usePage<{
        tokens: any[] | undefined;
        attributes: any;
        currentShipping: any;
        currentBilling: any;
    }>().props;

    const {
        form,
        showPassword,
        setShowPassword,
        token,
        tokenName,
        setTokenName,
        openTokenModal,
        setOpenTokenModal,
        tokenToDelete,
        isDeleteConfirmOpen,
        handleInputChange,
        handleSelectChange,
        getTokens,
        confirmDeleteToken,
        handleDeleteToken,
        cancelDeleteToken,
        generateToken,
        handleSubmit,
    } = useProfileForm({ attributes, currentShipping, currentBilling });

    return (
        <AppLayout breadcrumbs={[]}>
            <Head title={t('User Profile')} />
            <form onSubmit={handleSubmit}>
                <div className="flex h-full flex-1 flex-col gap-4 p-4">
                    <div className="w-full">
                        {/* Header */}
                        <div className="mb-8 flex flex-col items-start justify-between md:flex-row md:items-center">
                            <div>
                                <h1 className="text-primary flex items-center gap-2 text-3xl font-bold">
                                    <User className="text-primary h-8 w-8" />
                                    {t('Profile')}
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    {t('Manage your personal account settings and preferences')}
                                </p>
                            </div>

                            <div className="mt-4 flex items-center gap-3 md:mt-0">
                                <Button variant="outline" type="button" onClick={() => form.reset()} className="gap-2">
                                    <RefreshCw className="h-4 w-4" />
                                    {t('Reset')}
                                </Button>
                                <Button type="submit" className="gap-2">
                                    {t('Save Changes')}
                                </Button>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="overflow-hidden rounded-xl">
                            <Tabs defaultValue="general" className="w-full">
                                <TabsList className="h-12 w-full">
                                    <TabsTrigger value="general">
                                        <User className="h-4 w-4" />
                                        {t('General')}
                                    </TabsTrigger>
                                    <TabsTrigger value="shipping">
                                        <Home className="h-4 w-4" />
                                        {t('Shipping')}
                                    </TabsTrigger>
                                    <TabsTrigger value="billing">
                                        <CreditCard className="h-4 w-4" />
                                        {t('Billing')}
                                    </TabsTrigger>
                                    <TabsTrigger value="security">
                                        <Shield className="h-4 w-4" />
                                        {t('Security')}
                                    </TabsTrigger>
                                    <TabsTrigger value="api" onClick={getTokens}>
                                        <Key className="h-4 w-4" />
                                        {t('API Token')}
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="general">
                                    <ProfileGeneralTab form={form} handleSelectChange={handleSelectChange} />
                                </TabsContent>

                                <TabsContent value="shipping">
                                    <ProfileAddressTab type="shipping" form={form} handleInputChange={handleInputChange} />
                                </TabsContent>

                                <TabsContent value="billing">
                                    <ProfileAddressTab type="billing" form={form} handleInputChange={handleInputChange} />
                                </TabsContent>

                                <TabsContent value="security">
                                    <ProfileSecurityTab
                                        form={form}
                                        showPassword={showPassword}
                                        setShowPassword={setShowPassword}
                                        handleInputChange={handleInputChange}
                                    />
                                </TabsContent>

                                <TabsContent value="api">
                                    <ProfileApiTokensTab
                                        tokens={tokens}
                                        tokenName={tokenName}
                                        setTokenName={setTokenName}
                                        generateToken={generateToken}
                                        confirmDeleteToken={confirmDeleteToken}
                                    />
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    <TokenQrDialog
                        isOpen={openTokenModal}
                        onClose={() => setOpenTokenModal(false)}
                        tokenName={tokenName}
                        tokenValue={token}
                    />

                    <ConfirmationDialog
                        isOpen={isDeleteConfirmOpen}
                        onClose={cancelDeleteToken}
                        onConfirm={handleDeleteToken}
                        title={t('Revoke API Token')}
                        description={
                            tokenToDelete
                                ? t(
                                      'Are you sure you want to revoke the token "{{name}}"? This action cannot be undone and any applications using this token will lose access.',
                                      { name: tokenToDelete.name },
                                  )
                                : t('Are you sure you want to revoke this token?')
                        }
                        confirmText={t('Revoke Token')}
                        cancelText={t('Cancel')}
                        variant="destructive"
                    />
                </div>
            </form>
        </AppLayout>
    );
}
