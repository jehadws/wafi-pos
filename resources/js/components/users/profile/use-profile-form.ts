import { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { useTranslation } from '@/lib/i18n';
import { usersApi } from '@/api';
import { toast } from 'sonner';
import type { UserProfileFormData } from './types';

interface UseProfileFormProps {
    attributes?: any;
    currentShipping?: any;
    currentBilling?: any;
}

export function useProfileForm({ attributes = {}, currentShipping = {}, currentBilling = {} }: UseProfileFormProps) {
    const { t } = useTranslation();
    const [showPassword, setShowPassword] = useState(false);
    const [token, setToken] = useState('');
    const [tokenName, setTokenName] = useState('');
    const [openTokenModal, setOpenTokenModal] = useState(false);
    const [tokenToDelete, setTokenToDelete] = useState<any | null>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    const form = useForm<UserProfileFormData>({
        attribute_theme: attributes.theme || '',
        attribute_avatar_link: attributes.avatar_link || '',
        attribute_language: attributes.language || 'en',
        shipping_first_name: currentShipping.first_name || '',
        shipping_last_name: currentShipping.last_name || '',
        shipping_phone: currentShipping.phone || '',
        shipping_address_1: currentShipping.address_1 || '',
        shipping_address_2: currentShipping.address_2 || '',
        shipping_country: currentShipping.country || '',
        shipping_city: currentShipping.city || '',
        shipping_pobox: currentShipping.pobox || '',
        shipping_company: currentShipping.company || '',
        shipping_email: currentShipping.email || '',
        billing_first_name: currentBilling.first_name || '',
        billing_last_name: currentBilling.last_name || '',
        billing_phone: currentBilling.phone || '',
        billing_address_1: currentBilling.address_1 || '',
        billing_address_2: currentBilling.address_2 || '',
        billing_country: currentBilling.country || '',
        billing_city: currentBilling.city || '',
        billing_pobox: currentBilling.pobox || '',
        billing_company: currentBilling.company || '',
        billing_email: currentBilling.email || '',
        security_old_password: '',
        security_password: '',
        security_password_confirm: '',
        token: {},
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        form.setData({ ...form.data, [name]: value });
        // @ts-ignore
        if (form.errors[name]) form.clearErrors(name as any);
    };

    const handleSelectChange = (name: keyof UserProfileFormData, value: string | number) => {
        form.setData({ ...form.data, [name]: value });
        // @ts-ignore
        if (form.errors[name]) form.clearErrors(name as any);
    };

    const getTokens = () => {
        router.reload({ only: ['tokens'] });
    };

    const confirmDeleteToken = (tokenObj: any) => {
        setTokenToDelete(tokenObj);
        setIsDeleteConfirmOpen(true);
    };

    const handleDeleteToken = () => {
        if (tokenToDelete) {
            usersApi
                .deleteToken(tokenToDelete.id)
                .then(() => {
                    toast.success(t('Token deleted successfully'));
                    getTokens();
                    setIsDeleteConfirmOpen(false);
                    setTokenToDelete(null);
                })
                .catch((error) => {
                    if (error.response?.data?.errors) {
                        toast.error(t('Please fix the validation errors'));
                    } else {
                        toast.error(t('Something went wrong'));
                    }
                });
        }
    };

    const cancelDeleteToken = () => {
        setIsDeleteConfirmOpen(false);
        setTokenToDelete(null);
    };

    const generateToken = () => {
        usersApi
            .createToken(tokenName)
            .then((data) => {
                const plainToken = data.data.token.plainTextToken;
                setToken(plainToken);
                setOpenTokenModal(true);
                toast.success(t('Token created successfully'));
            })
            .catch((error) => {
                if (error.response?.data?.errors) {
                    toast.error(t('Please fix the validation errors'));
                } else {
                    toast.error(t('Something went wrong'));
                }
            });
    };

    const validateForm = (): boolean => {
        let isValid = true;
        form.clearErrors();
        if (form.data.security_password !== form.data.security_password_confirm) {
            isValid = false;
            form.setError('security_password_confirm', t('The password confirmation does not match.'));
        }
        return isValid;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!validateForm()) return;

        const security =
            form.data.security_password !== '' && form.data.security_old_password !== ''
                ? {
                      old_password: form.data.security_old_password,
                      password: form.data.security_password,
                      password_confirm: form.data.security_password_confirm,
                  }
                : {};

        form.transform(() => ({
            attribute: {
                theme: form.data.attribute_theme,
                avatar_link: form.data.attribute_avatar_link,
                language: form.data.attribute_language,
            },
            shipping: {
                first_name: form.data.shipping_first_name,
                last_name: form.data.shipping_last_name,
                phone: form.data.shipping_phone,
                address_1: form.data.shipping_address_1,
                address_2: form.data.shipping_address_2,
                country: form.data.shipping_country,
                city: form.data.shipping_city,
                pobox: form.data.shipping_pobox,
                company: form.data.shipping_company,
                email: form.data.shipping_email,
            },
            billing: {
                first_name: form.data.billing_first_name,
                last_name: form.data.billing_last_name,
                phone: form.data.billing_phone,
                address_1: form.data.billing_address_1,
                address_2: form.data.billing_address_2,
                country: form.data.billing_country,
                city: form.data.billing_city,
                pobox: form.data.billing_pobox,
                company: form.data.billing_company,
                email: form.data.billing_email,
            },
            security,
            token: {},
        }));

        form.post('/api/forms/ns.user-profile', {
            preserveScroll: true,
            onError: () => {
                toast.error(t('Please fix the validation errors'));
            },
            onSuccess: () => {
                toast.success(t('The user attribute has been saved.'));
            },
        });
    };

    return {
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
    };
}
