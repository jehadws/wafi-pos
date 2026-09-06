'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import { customersApi } from '@/api';
import { AlertCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SelectCustomerDialogProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  activeCoupons: any[];
  onApplyCoupon: (coupon: any) => void;
  onRemoveCoupon: (coupon: any) => void;
  selectedCustomer: { id: number; first_name?: string; last_name?: string;[key: string]: any } | null;
  setShowSelectCustomerDialog: (value: boolean) => void;
}

export default function CouponsDialog({
  isOpen,
  onClose,
  selectedCustomer,
  onRemoveCoupon,
  onApplyCoupon,
  setShowSelectCustomerDialog,
  activeCoupons,
}: SelectCustomerDialogProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('apply');
  const [couponCode, setCouponCode] = useState('');

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error(t('Please enter a coupon code'));
      return;
    }

    if (activeCoupons?.find((c) => c.code === couponCode)) {
      toast.error(t('Coupon already applied'));
      return;
    }

    if (!selectedCustomer) {
      setShowSelectCustomerDialog(true);
      return;
    }

    setLoading(true);

    try {
      const coupon = await customersApi.applyCoupon(couponCode, selectedCustomer.id);

      if (coupon) {
        onApplyCoupon(coupon);
        setCouponCode('');
        toast.success(t('Coupon applied successfully'));
      }
    } catch {
      toast.error(t('Failed to apply coupon'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Load Coupon')}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="apply" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="apply">{t('Apply A Coupon')}</TabsTrigger>
              <TabsTrigger value="active">{t('Active Coupons')}</TabsTrigger>
            </TabsList>

            <TabsContent value="apply" className="space-y-4 py-4">
              <div className="flex gap-2">
                <Input
                  placeholder={t('Coupon Code')}
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1"
                />
                <Button type="button" disabled={loading} onClick={handleApplyCoupon}>
                  {t('Load')}
                </Button>
              </div>

              <Alert className="bg-muted text-primary border">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t(
                    'Input the coupon code that should apply to the POS. If a coupon is issued for a customer, that customer must be selected priorly.',
                  )}
                </AlertDescription>
              </Alert>

              {!selectedCustomer && (
                <Button variant="outline" className="w-full" onClick={() => setShowSelectCustomerDialog(true)}>
                  {t('Click here to choose a customer.')}
                </Button>
              )}

              {selectedCustomer && (
                <div className="bg-primary/15 rounded-lg border border-primary/20 p-4">
                  <p className="text-center text-sm">
                    {t('Load coupon for')} {selectedCustomer.first_name} {selectedCustomer.last_name}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="active" className="py-4">
              {activeCoupons && activeCoupons?.length > 0 ? (
                <div className="space-y-2">
                  {activeCoupons.map((coupon) => (
                    <div key={coupon.code} className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <p className="font-medium">{coupon.code}</p>
                        <p className="text-muted-foreground text-sm">
                          {coupon.type === 'percentage_discount'
                            ? `${coupon.discount_value}% off`
                            : `$${coupon.discount_value.toFixed(2)} off`}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => onRemoveCoupon(coupon)}>
                        <Trash2 className="text-destructive h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[100px] items-center justify-center rounded-md border border-dashed">
                  <p className="text-muted-foreground text-sm">{t('No coupons applies to the cart.')}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
