import React from 'react';
import FormField from '@/components/forms/shared/form-field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import { Eye, EyeOff, Lock } from 'lucide-react';
import type { UserProfileFormData } from './types';

interface ProfileSecurityTabProps {
    form: {
        data: UserProfileFormData;
        errors: Partial<Record<keyof UserProfileFormData, string>>;
    };
    showPassword: boolean;
    setShowPassword: (show: boolean) => void;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export function ProfileSecurityTab({
    form,
    showPassword,
    setShowPassword,
    handleInputChange,
}: ProfileSecurityTabProps) {
    const { t } = useTranslation();

    return (
        <div className="space-y-6 pt-4 focus:outline-none">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Lock className="text-primary h-5 w-5" />
                        {t('Password Management')}
                    </CardTitle>
                    <CardDescription>{t('Update your password to keep your account secure')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <FormField
                            label={t('Current Password')}
                            htmlFor="security_old_password"
                            description={t('Enter your Current password')}
                            error={form.errors?.security_old_password}
                        >
                            <div className="relative">
                                <Lock className="text-primary-400 absolute top-3 start-3 h-4 w-4" />
                                <Input
                                    id="security_old_password"
                                    name="security_old_password"
                                    value={form.data.security_old_password}
                                    onChange={handleInputChange}
                                    className={
                                        form.errors?.security_old_password ? 'border-red-500 pe-10 ps-10' : 'pe-10 ps-10'
                                    }
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    className="text-primary-400 hover:text-primary-600 absolute top-3 end-3"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </FormField>

                        <FormField
                            label={t('New Password')}
                            htmlFor="security_password"
                            description={t('At least 8 characters with letters and numbers')}
                            error={form.errors?.security_password}
                        >
                            <div className="relative">
                                <Lock className="text-primary-400 absolute top-3 start-3 h-4 w-4" />
                                <Input
                                    id="security_password"
                                    name="security_password"
                                    value={form.data.security_password}
                                    onChange={handleInputChange}
                                    className={form.errors?.security_password ? 'border-red-500 pe-10 ps-10' : 'pe-10 ps-10'}
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    className="text-primary-400 hover:text-primary-600 absolute top-3 end-3"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </FormField>

                        <FormField
                            label={t('Confirm New Password')}
                            htmlFor="security_password_confirm"
                            description={t('Re-enter your new password')}
                            error={form.errors?.security_password_confirm}
                        >
                            <div className="relative">
                                <Lock className="text-primary-400 absolute top-3 start-3 h-4 w-4" />
                                <Input
                                    id="security_password_confirm"
                                    name="security_password_confirm"
                                    value={form.data.security_password_confirm}
                                    onChange={handleInputChange}
                                    className={
                                        form.errors?.security_password_confirm ? 'border-red-500 pe-10 ps-10' : 'pe-10 ps-10'
                                    }
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    className="text-primary-400 hover:text-primary-600 absolute top-3 end-3"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </FormField>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
