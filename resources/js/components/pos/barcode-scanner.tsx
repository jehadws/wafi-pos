import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Barcode, Camera, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export default function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
  const { t } = useTranslation();
  const [barcode, setBarcode] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setBarcode('');
      setIsScanning(false);
    }
  }, [isOpen]);

  const handleManualEntry = () => {
    if (barcode.trim()) {
      onScan(barcode);
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    // In a real implementation, this would activate the camera and barcode scanner
    // For this demo, we'll simulate scanning after a short delay
    setTimeout(() => {
      // Simulate a successful scan with a random product barcode
      const sampleBarcodes = [
        '1234567890123', // Coffee
        '2234567890123', // Sandwich
        '3234567890123', // Muffin
        '4234567890123', // Salad
        '5234567890123', // Tea
      ];
      const randomBarcode = sampleBarcodes[Math.floor(Math.random() * sampleBarcodes.length)];
      setBarcode(randomBarcode);
      setIsScanning(false);

      toast.success(t('Barcode detected'), {
        description: randomBarcode,
      });
    }, 2000);
  };

  const stopScanning = () => {
    setIsScanning(false);
    toast.info(t('Scanning cancelled'));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Barcode className="me-2 h-5 w-5" />
            {t('Barcode Scanner')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col space-y-4">
          {isScanning ? (
            <div className="bg-muted relative aspect-video overflow-hidden rounded-md">
              <div className="absolute inset-0 flex items-center justify-center">
                {/* This would be a camera view in a real implementation */}
                <div className="flex animate-pulse flex-col items-center justify-center">
                  <Camera className="text-muted-foreground mb-2 h-10 w-10" />
                  <p className="text-muted-foreground text-sm">{t('Scanning...')}</p>
                </div>
              </div>

              {/* Scanning animation */}
              <div className="bg-primary absolute end-0 start-0 h-0.5 animate-[scan_2s_ease-in-out_infinite]" />

              <Button variant="secondary" size="sm" className="absolute top-2 end-2" onClick={stopScanning}>
                <X className="me-1 h-4 w-4" />
                {t('Cancel')}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Input
                  placeholder={t('Enter barcode manually')}
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleManualEntry} disabled={!barcode.trim()}>
                  {t("Add")}
                </Button>
              </div>

              <div className="flex justify-center">
                <div className="bg-border h-6 w-px" />
              </div>

              <Button onClick={startScanning} variant="outline" className="w-full">
                <Camera className="me-2 h-4 w-4" />
                {t('Scan Barcode')}
              </Button>
            </>
          )}
        </div>

        <DialogFooter className="sm:justify-start">
          <Button variant="secondary" onClick={onClose}>
            {t('Close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
