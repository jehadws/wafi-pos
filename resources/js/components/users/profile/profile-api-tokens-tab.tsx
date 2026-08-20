import React from 'react';
import FormField from '@/components/forms/shared/form-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import { FileText, Key, Trash2 } from 'lucide-react';

interface ProfileApiTokensTabProps {
    tokens: any[] | undefined;
    tokenName: string;
    setTokenName: (name: string) => void;
    generateToken: () => void;
    confirmDeleteToken: (token: any) => void;
}

export function ProfileApiTokensTab({
    tokens,
    tokenName,
    setTokenName,
    generateToken,
    confirmDeleteToken,
}: ProfileApiTokensTabProps) {
    const { t } = useTranslation();

    return (
        <div className="space-y-6 pt-4 focus:outline-none">
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex gap-3">
                    <div className="mt-0.5 text-blue-600">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="mb-1 font-medium text-blue-800">{t('About API Tokens')}</h3>
                        <p className="text-sm text-blue-700">
                            {t(
                                'API tokens provide secure access to resources without sharing your personal credentials. Tokens remain active until explicitly revoked. Keep your tokens secure and never share them publicly.',
                            )}
                        </p>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Key className="text-primary h-5 w-5" />
                        {t('Create New Token')}
                    </CardTitle>
                    <CardDescription>{t('Generate a new API token for your applications')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                            label={t('Token Name')}
                            htmlFor="tokenName"
                            description={t('A descriptive name to identify this token')}
                        >
                            <div className="relative">
                                <FileText className="text-primary-400 absolute top-3 left-3 h-4 w-4" />
                                <Input
                                    id="tokenName"
                                    name="tokenName"
                                    value={tokenName}
                                    onChange={(e) => setTokenName(e.target.value)}
                                    className="pr-10 pl-10"
                                    placeholder="My API Token"
                                />
                            </div>
                        </FormField>
                    </div>

                    <div className="pt-2">
                        <Button type="button" onClick={generateToken}>
                            {t('Generate Token')}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Key className="text-primary h-5 w-5" />
                        {t('Active Tokens')}
                    </CardTitle>
                    <CardDescription>{t('Manage your existing API tokens')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {!tokens || tokens.length === 0 ? (
                        <div className="py-8 text-center text-slate-500">
                            <p>{t("You haven't generated any tokens yet.")}</p>
                            <p className="mt-1 text-sm">{t('Create your first token to get started.')}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tokens.map((token) => (
                                <div key={token.id} className="rounded-lg border p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Key className="h-5 w-5" />
                                            <div>
                                                <div className="font-medium">{token.name}</div>
                                                <div className="text-xs">Created {token.created_at}</div>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className="ml-2 border-green-200 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-800 dark:text-green-400"
                                            >
                                                Active
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                                                onClick={() => confirmDeleteToken(token)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
