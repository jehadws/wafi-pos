import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { Head } from '@inertiajs/react';
import { transactionsApi } from '@/api';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { RuleRow } from './components/rule-row';

export default function AccountingRulesManager() {
    const { t } = useTranslation();
    const [rules, setRules] = useState<TransactionRule[]>([]);
    const [accounts, setAccounts] = useState<TransactionAccount[]>([]);
    const [actions, setActions] = useState<{ [key: string]: string }>({});
    const [showNewRule, setShowNewRule] = useState(false);

    const getRules = async () => {
        try {
            const rules = await transactionsApi.getRules();
            setRules(rules);
        } catch (error) {
            console.error(error);
        }
    };

    const getAccounts = async () => {
        try {
            const accounts = await transactionsApi.getAccounts();
            setAccounts(accounts);
        } catch (error) {
            console.error(error);
        }
    };

    const getActions = async () => {
        try {
            const actions = await transactionsApi.getAccountActions();
            setActions(actions);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSave = async (rule: Partial<TransactionRule>) => {
        try {
            const { message } = await transactionsApi.createRule(rule);
            toast(message);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            const { message } = await transactionsApi.deleteRule(id);
            toast(message);
        } catch (error) {
            console.error(error);
        } finally {
            setRules((prev) => prev.filter((rule) => rule.id !== id));
        }
    };

    useEffect(() => {
        getActions();
        getAccounts();
        getRules();
    }, []);

    return (
        <AppLayout
            breadcrumbs={[
                { title: t('Dashboard'), href: '/dashboard' },
                { title: t('Accounting'), href: '/dashboard/accounting' },
                { title: t('Rules'), href: '/dashboard/accounting/rules' },
            ]}
        >
            <Head title={t('Rules - JGREM')} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="grid w-full">
                    <div className="">
                        <div className="overflow-hidden rounded-lg border">
                            {rules.map((rule) => (
                                <RuleRow
                                    accounts={accounts}
                                    actions={actions}
                                    key={rule.id}
                                    rule={rule}
                                    onSave={handleSave}
                                    onDelete={handleDelete}
                                />
                            ))}

                            {showNewRule && <RuleRow accounts={accounts} actions={actions} isNew onSave={handleSave} />}
                        </div>

                        <div className="mt-6 text-center">
                            <Button onClick={() => setShowNewRule(true)} variant="outline" className="flex w-full items-center gap-2">
                                <Plus className="h-4 w-4" />
                                {t('Create a new rule')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
