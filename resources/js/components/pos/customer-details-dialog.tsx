import { customersApi } from '@/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Customer } from '@/types/models/customer';
import { formatCurrency, formatDate } from '@/utils/format';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../lib/i18n';

interface CustomerDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null | undefined;
}

export function CustomerDetailsDialog({ open, onOpenChange, customer }: CustomerDetailsDialogProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('customer-account');
  const [activeSubTab, setActiveSubTab] = useState('orders');
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);

  const fetchCustomerOrders = async () => {
    if (!customer) return;
    setLoadingOrders(true);
    try {
      const orders = await customersApi.getOrders(customer.id);
      setOrders(orders);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (open && customer && activeTab === 'customer-account' && activeSubTab === 'orders') {
      fetchCustomerOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeTab, activeSubTab, customer]);

  if (!customer) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-h-[90vh] max-w-4xl flex-col overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t('Details')}</DialogTitle>
          <DialogDescription className="sr-only">{t('Details')}</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden pt-4">
          <Tabs defaultValue="customer-account" className="flex min-h-0 flex-1 flex-col" onValueChange={setActiveTab} value={activeTab}>
            <TabsList className="grid w-full shrink-0 grid-cols-2">
              <TabsTrigger value="new-customer">{t('Create Customer')}</TabsTrigger>
              <TabsTrigger value="customer-account">{t('Customer Account')}</TabsTrigger>
            </TabsList>

            <TabsContent value="customer-account" className="mt-4 min-h-0 flex-1 flex-col space-y-4 data-[state=active]:flex">
              <div className="bg-muted/30 shrink-0 rounded-lg p-4">
                <h3 className="mb-4 font-medium">
                  {t('Summary For')} : {customer.first_name} {customer.last_name || ''}
                </h3>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="bg-primary text-primary-foreground rounded-lg p-3 text-center">
                    <div className="text-sm font-medium">{t('Total Purchases')}</div>
                    <div className="text-lg font-bold tabular-nums">{formatCurrency(+(customer.purchases_amount || 0))}</div>
                  </div>
                  <div className="bg-destructive text-destructive-foreground rounded-lg p-3 text-center">
                    <div className="text-sm font-medium">{t('Owed Amount')}</div>
                    <div className="text-lg font-bold tabular-nums">{formatCurrency(+(customer.owed_amount || 0))}</div>
                  </div>
                  <div className="bg-secondary text-secondary-foreground rounded-lg p-3 text-center">
                    <div className="text-sm font-medium">{t('Account Credit')}</div>
                    <div className="text-lg font-bold tabular-nums">{formatCurrency(+(customer.account_amount || 0))}</div>
                  </div>
                  <div className="bg-primary/80 text-primary-foreground rounded-lg p-3 text-center">
                    <div className="text-sm font-medium">{t('Limit')}</div>
                    <div className="text-lg font-bold tabular-nums">{formatCurrency(+(customer.credit_limit_amount || 0))}</div>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="orders" className="flex min-h-0 flex-1 flex-col" onValueChange={setActiveSubTab} value={activeSubTab}>
                <TabsList className="grid w-full shrink-0 grid-cols-4">
                  <TabsTrigger value="orders">{t('Orders')}</TabsTrigger>
                  <TabsTrigger value="wallet-history">{t('Account Credit')}</TabsTrigger>
                  <TabsTrigger value="coupons">{t('Coupons')}</TabsTrigger>
                  <TabsTrigger value="rewards">{t('Rewards')}</TabsTrigger>
                </TabsList>

                <TabsContent value="orders" className="mt-4 min-h-0 flex-1 flex-col space-y-4 data-[state=active]:flex">
                  <h4 className="shrink-0 px-2 font-medium">{t('Last Purchases')}</h4>

                  {loadingOrders ? (
                    <div className="flex flex-1 items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ms-2">{t('Loading...')}</span>
                    </div>
                  ) : (
                    <div className="flex min-h-0 flex-1 flex-col rounded-lg border">
                      <div className="bg-muted/50 grid shrink-0 grid-cols-2 p-3 text-center font-medium">
                        <div>{t('Order')}</div>
                        <div>{t('Options')}</div>
                      </div>

                      <ScrollArea className="flex-1">
                        {orders.length > 0 ? (
                          orders.map((order) => (
                            <div key={order.id} className="grid grid-cols-2 items-center border-b p-3 last:border-b-0">
                              <div className="space-y-1">
                                <div className="font-medium">Code: {order.code}</div>
                                <div className="text-sm">
                                  Total: {formatCurrency(order.total)} | Status: {order.human_status}
                                </div>
                                <div className="text-sm">Delivery: {order.human_delivery_status}</div>
                                <div className="text-sm">Date: {formatDate(order.created_at)}</div>
                              </div>
                              <div className="text-center">
                                <Button variant="outline" size="sm">
                                  Options
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-muted-foreground p-8 text-center">{t('No customer orders has been registered')}</div>
                        )}
                      </ScrollArea>
                    </div>
                  )}

                  <div className="flex shrink-0 justify-end pb-2">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">{t('Account Transaction')}</Button>
                  </div>
                </TabsContent>

                <TabsContent value="wallet-history" className="space-y-4">
                  <div className="text-muted-foreground p-8 text-center">{t('Well.. nothing to show for the meantime')}</div>
                </TabsContent>

                <TabsContent value="coupons" className="space-y-4">
                  <div className="text-muted-foreground p-8 text-center">{t('Well.. nothing to show for the meantime')}</div>
                </TabsContent>

                <TabsContent value="rewards" className="space-y-4">
                  <div className="text-muted-foreground p-8 text-center">{t('Well.. nothing to show for the meantime')}</div>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="new-customer" className="space-y-4">
              <div className="text-muted-foreground p-8 text-center">{t('Well.. nothing to show for the meantime')}</div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
