import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import { ChevronRight, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AccountSelectorModal } from './account-selector-modal';
import { ActionSelectorModal } from './action-selector-modal';

interface RuleRowProps {
    accounts: TransactionAccount[];
    actions: { [key: string]: string };
    rule?: TransactionRule;
    isNew?: boolean;
    onSave?: (rule: Partial<TransactionRule>) => void;
    onDelete?: (id: number) => void;
}

export function RuleRow({ accounts, actions, rule, isNew = false, onSave, onDelete }: RuleRowProps) {
    const { t } = useTranslation();
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isOffsetAccountModalOpen, setIsOffsetAccountModalOpen] = useState(false);

    const [selectedAction, setSelectedAction] = useState<{ key: string; label: string } | null>(
        rule && actions[rule.on] ? { key: rule.on, label: actions[rule.on] } : null,
    );
    const [selectedAccount, setSelectedAccount] = useState<TransactionAccount | null>(
        rule ? accounts.find((a) => a.id === rule.account_id) || null : null,
    );
    const [selectedOffsetAccount, setSelectedOffsetAccount] = useState<TransactionAccount | null>(
        rule ? accounts.find((a) => a.id === rule.offset_account_id) || null : null,
    );
    const [action, setAction] = useState<'increase' | 'decrease'>(rule?.action || 'increase');
    const [doAction, setDoAction] = useState<'increase' | 'decrease'>(rule?.do || 'increase');

    const handleSave = () => {
        if (selectedAction && selectedAccount && selectedOffsetAccount) {
            const ruleData: Partial<TransactionRule> = {
                ...(rule?.id && { ...rule }),
                on: selectedAction.key,
                action,
                account_id: selectedAccount.id,
                do: doAction,
                offset_account_id: selectedOffsetAccount.id,
            };
            onSave?.(ruleData);
        }
    };

    return (
        <>
            <div className="flex items-center gap-2 border-b p-4 text-sm last:border-0">
                <span className="">{t('On')} :</span>

                <Button variant="outline" size="sm" onClick={() => setIsActionModalOpen(true)} className="h-8 px-3">
                    {selectedAction ? selectedAction.label : t('Not Defined')}
                </Button>

                <ChevronRight className="h-4 w-4" />

                <Select value={action} onValueChange={(value) => setAction(value as 'increase' | 'decrease')}>
                    <SelectTrigger>
                        <SelectValue placeholder={t('Select an option')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="increase">{t('Increase')}</SelectItem>
                        <SelectItem value="decrease">{t('Decrease')}</SelectItem>
                    </SelectContent>
                </Select>

                <Button variant="outline" size="sm" onClick={() => setIsAccountModalOpen(true)} className="h-8 px-3">
                    {selectedAccount ? selectedAccount.name : t('Not Defined')}
                </Button>

                <ChevronRight className="h-4 w-4" />

                <Select value={doAction} onValueChange={(value) => setDoAction(value as 'increase' | 'decrease')}>
                    <SelectTrigger>
                        <SelectValue placeholder={t('Select an option')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="increase">{t('Increase')}</SelectItem>
                        <SelectItem value="decrease">{t('Decrease')}</SelectItem>
                    </SelectContent>
                </Select>

                <Button variant="outline" size="sm" onClick={() => setIsOffsetAccountModalOpen(true)} className="h-8 px-3">
                    {selectedOffsetAccount ? selectedOffsetAccount.name : t('Not Defined')}
                </Button>

                <div className="flex-1" />

                <Button variant="outline" size="sm" onClick={handleSave} className="flex h-8 items-center gap-1 bg-transparent px-3">
                    <Save className="h-3 w-3" />
                    {t('Save')}
                </Button>

                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => rule?.id != null && onDelete?.(rule.id)}>
                    <Trash2 className="text-destructive h-4 w-4" />
                </Button>
            </div>

            <ActionSelectorModal
                actions={actions}
                isOpen={isActionModalOpen}
                onClose={() => setIsActionModalOpen(false)}
                onSelect={setSelectedAction}
                selectedAction={selectedAction}
            />

            <AccountSelectorModal
                accounts={accounts}
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
                onSelect={setSelectedAccount}
                selectedAccount={selectedAccount}
            />

            <AccountSelectorModal
                accounts={accounts}
                isOpen={isOffsetAccountModalOpen}
                onClose={() => setIsOffsetAccountModalOpen(false)}
                onSelect={setSelectedOffsetAccount}
                selectedAccount={selectedOffsetAccount}
            />
        </>
    );
}
