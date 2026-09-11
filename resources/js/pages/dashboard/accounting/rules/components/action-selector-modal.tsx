import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import SelectableItem from '@/components/ui/selectable-item';
import { useTranslation } from '@/lib/i18n';
import { useState } from 'react';

interface ActionSelectorModalProps {
  actions: { [key: string]: string };
  isOpen: boolean;
  onClose: () => void;
  onSelect: (action: { key: string; label: string }) => void;
  selectedAction?: { key: string; label: string } | null;
}

export function ActionSelectorModal({ actions, isOpen, onClose, onSelect, selectedAction }: ActionSelectorModalProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  const actionsArray = Object.keys(actions).map((key) => ({
    key,
    label: actions[key],
  }));

  const filteredActions = actionsArray.filter((action) => action.label.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSelect = (action: { key: string; label: string }) => {
    onSelect(action);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="relative">
          <DialogTitle className="text-center">{t('Choose Action')}</DialogTitle>
        </DialogHeader>

        <div className="bg-accent/30 text-primary mb-4 rounded p-3 text-center text-sm">{t('Choose the action you want to perform.')}</div>

        <Input placeholder={t('Search for options')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="mb-4" />

        <div className="max-h-80 space-y-1 overflow-y-auto">
          {filteredActions.map((action) => (
            <SelectableItem
              onChange={() => handleSelect(action)}
              label={action.label}
              value={action.key}
              key={action.key}
              selected={action?.key === selectedAction?.key}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
