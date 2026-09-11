'use client';

import QRCode from '@/components/common/qr-code';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

interface TokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenName: string;
  tokenValue: string;
}

export function TokenQrDialog({ isOpen, onClose, tokenValue }: TokenModalProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(tokenValue);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">{t('API Token')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 py-4">
          <div className="border border-slate-200 bg-white p-2">
            <div className="flex h-[200px] w-[200px] items-center justify-center">
              <QRCode value={tokenValue} size={200} />
            </div>
          </div>

          <p className="text-center text-sm text-slate-600">{t('This QR code is provided to ease authentication on external applications.')}</p>

          <p className="max-w-md text-center text-sm text-slate-700">
            {t(
              'The API token has been generated. Make sure to copy this code in a safe place as it will only be displayed once. If you lose this token, you will need to revoke it and generate a new one.',
            )}
          </p>

          <div className="w-full">
            <Input value={tokenValue} readOnly className="border-blue-200 bg-blue-50 font-mono text-sm select-all" />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={copyToClipboard} className="bg-blue-600 hover:bg-blue-700">
            {copied ? (
              <>
                <Check className="me-2 h-4 w-4" />
                {t('Copied')}
              </>
            ) : (
              <>
                <Copy className="me-2 h-4 w-4" />
                {t('Copy And Close')}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
