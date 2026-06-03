import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/utils/format';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../lib/i18n';
import { ScrollArea } from '../ui/scroll-area';

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
    setLoadingOrders(true);
    try {
      // /api/customers/73/orders
      const res = await axios.get(`/api/customers/${customer?.id}/orders`);
      setOrders(res.data);
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

        <div className="flex flex-1 flex-col overflow-hidden min-h-0 pt-4">
          <Tabs defaultValue="customer-account" className="flex flex-1 flex-col min-h-0" onValueChange={setActiveTab} value={activeTab}>
            <TabsList className="grid w-full shrink-0 grid-cols-2">
              <TabsTrigger value="new-customer">{t('Create Customer')}</TabsTrigger>
              <TabsTrigger value="customer-account">{t('Customer Account')}</TabsTrigger>
            </TabsList>

            <TabsContent value="customer-account" className="data-[state=active]:flex flex-col flex-1 min-h-0 space-y-4 mt-4">
              <div className="rounded-lg p-4 shrink-0 bg-muted/30">
                <h3 className="mb-4 font-medium">
                  {t('Summary For')} : {customer.first_name} {customer.last_name || ''}
                </h3>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="rounded-lg bg-green-500 p-3 text-center text-white">
                    <div className="text-sm font-medium">{t('Total Purchases')}</div>
                    <div className="text-lg font-bold">{formatCurrency(+customer.purchases_amount)}</div>
                  </div>
                  <div className="rounded-lg bg-red-500 p-3 text-center text-white">
                    <div className="text-sm font-medium">{t('Owed Amount')}</div>
                    <div className="text-lg font-bold">{formatCurrency(+customer.owed_amount)}</div>
                  </div>
                  <div className="rounded-lg bg-blue-500 p-3 text-center text-white">
                    <div className="text-sm font-medium">{t('Account Credit')}</div>
                    <div className="text-lg font-bold">{formatCurrency(+customer.account_amount)}</div>
                  </div>
                  <div className="rounded-lg bg-teal-500 p-3 text-center text-white">
                    <div className="text-sm font-medium">{t('Limit')}</div>
                    <div className="text-lg font-bold">{formatCurrency(customer.credit_limit_amount)}</div>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="orders" className="flex flex-col flex-1 min-h-0" onValueChange={setActiveSubTab} value={activeSubTab}>
                <TabsList className="grid w-full shrink-0 grid-cols-4">
                  <TabsTrigger value="orders">{t('Orders')}</TabsTrigger>
                  <TabsTrigger value="wallet-history">{t('Account Credit')}</TabsTrigger>
                  <TabsTrigger value="coupons">{t('Coupons')}</TabsTrigger>
                  <TabsTrigger value="rewards">{t('Rewards')}</TabsTrigger>
                </TabsList>

                <TabsContent value="orders" className="data-[state=active]:flex flex-col flex-1 min-h-0 space-y-4 mt-4">
                  <h4 className="px-2 font-medium shrink-0">{t('Last Purchases')}</h4>

                  {loadingOrders ? (
                    <div className="flex flex-1 items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">{t('Loading...')}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col flex-1 min-h-0 rounded-lg border">
                      <div className="grid grid-cols-2 bg-muted/50 p-3 text-center font-medium shrink-0">
                        <div>{t('Order')}</div>
                        <div>{t('Options')}</div>
                      </div>

                      <ScrollArea className="flex-1">

                        {orders.length > 0 ? (
                          orders.map((order) => (
                            <div key={order.id} className="grid grid-cols-2 items-center p-3 border-b last:border-b-0">
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
                          <div className="p-8 text-center text-gray-500">{t('No customer orders has been registered')}</div>
                        )}
                      </ScrollArea>
                    </div>
                  )}

                  <div className="flex shrink-0 justify-end pb-2">
                    <Button className="bg-blue-600 text-white hover:bg-blue-700">{t('Account Transaction')}</Button>
                  </div>
                </TabsContent>

                <TabsContent value="wallet-history" className="space-y-4">
                  <div className="p-8 text-center text-gray-500">{t('Well.. nothing to show for the meantime')}</div>
                </TabsContent>

                <TabsContent value="coupons" className="space-y-4">
                  <div className="p-8 text-center text-gray-500">{t('Well.. nothing to show for the meantime')}</div>
                </TabsContent>

                <TabsContent value="rewards" className="space-y-4">
                  <div className="p-8 text-center text-gray-500">{t('Well.. nothing to show for the meantime')}</div>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="new-customer" className="space-y-4">
              <div className="p-8 text-center text-gray-500">{t('Well.. nothing to show for the meantime')}</div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
