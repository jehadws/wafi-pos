import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { Loader2, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import ConfirmationDialog from '../confirmation-dialog';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import OrderCard from './order-card';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrdersDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const [isOpenOrderOpen, setIsOpenOrderOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(false);
  const [onHoldOrders, setOnHoldOrders] = useState<PaginatedOrders>({ data: [], page: 1, lastPage: 1 });
  const [unpaidOrders, setUnpaidOrders] = useState<PaginatedOrders>({ data: [], page: 1, lastPage: 1 });
  const [partiallyPaidOrders, setPartiallyPaidOrders] = useState<PaginatedOrders>({ data: [], page: 1, lastPage: 1 });

  const getOnHoldOrders = async (search?: string, page = 1) => {
    setLoading(true);
    try {
      const res = await axios.get('/api/crud/ns.hold-orders', {
        params: { search, page },
      });
      setOnHoldOrders({ data: res.data.data, page: res.data.current_page, lastPage: res.data.last_page });
    } catch (error) {
      console.error('Error fetching On Hold Orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUnpaidOrders = async (search?: string, page = 1) => {
    setLoading(true);
    try {
      const res = await axios.get('/api/crud/ns.unpaid-orders', {
        params: { search, page },
      });
      setUnpaidOrders({ data: res.data.data, page: res.data.current_page, lastPage: res.data.last_page });
    } catch (error) {
      console.error('Error fetching Unpaid Orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPartiallyPaidOrders = async (search?: string, page = 1) => {
    setLoading(true);
    try {
      const res = await axios.get('/api/crud/ns.partially-paid-orders', {
        params: { search, page },
      });
      setPartiallyPaidOrders({ data: res.data.data, page: res.data.current_page, lastPage: res.data.last_page });
    } catch (error) {
      console.error('Error fetching Partially Paid Orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      getOnHoldOrders();
    }
  }, [open]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn('flex h-[90vh] max-h-[90vh] w-[50vw] max-w-[50vw] flex-col sm:max-w-[50vw]')}>
          <DialogTitle>{t('Orders')}</DialogTitle>
          <DialogDescription className="sr-only">{t('Orders')}</DialogDescription>
          <Tabs defaultValue="on-hold" className={cn('flex-1')}>
            <TabsList>
              <TabsTrigger
                value="on-hold"
                onClick={() => {
                  setSearchQuery('');
                  getOnHoldOrders();
                }}
              >
                {t('On Hold')}
              </TabsTrigger>
              <TabsTrigger
                value="unpaid"
                onClick={() => {
                  setSearchQuery('');
                  getUnpaidOrders();
                }}
              >
                {t('Unpaid')}
              </TabsTrigger>
              <TabsTrigger
                value="partially-paid"
                onClick={() => {
                  setSearchQuery('');
                  getPartiallyPaidOrders();
                }}
              >
                {t('Partially Paid')}
              </TabsTrigger>
            </TabsList>
            <Separator />
            <TabsContent value={'on-hold'} className={cn('flex flex-1 flex-col')}>
              <div className="relative flex w-full flex-row items-center gap-2">
                <Input
                  placeholder={t('Search Orders')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                  onKeyDown={(e) => e.key === 'Enter' && getOnHoldOrders(searchQuery)}
                />
                <Button onClick={() => getOnHoldOrders(searchQuery)}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {!loading && (
                <>
                  <ScrollArea className="min-h-[150px] flex-1">
                    <div className="flex flex-1 flex-col gap-3">
                      {onHoldOrders.data?.map((order) => (
                        <OrderCard key={order.id} onOpenChange={onOpenChange} order={order} />
                      ))}
                    </div>
                  </ScrollArea>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => getOnHoldOrders(searchQuery, Math.max(onHoldOrders.page - 1, 1))}
                        />
                      </PaginationItem>
                      {Array.from({ length: onHoldOrders.lastPage }, (_, i) => i + 1).map((num) => (
                        <PaginationItem key={num}>
                          <PaginationLink
                            onClick={() => setOnHoldOrders((prev) => ({ ...prev, page: num }))}
                            isActive={num === onHoldOrders.page}
                          >
                            {num}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            getOnHoldOrders(searchQuery, Math.min(onHoldOrders.page + 1, onHoldOrders.lastPage))
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </>
              )}
              {loading && (
                <div className="flex min-h-[150px] flex-1 items-center justify-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </div>
              )}
            </TabsContent>

            <TabsContent value="unpaid" className={cn('flex flex-1 flex-col')}>
              <div className="relative flex w-full flex-row items-center gap-2">
                <Input
                  placeholder={t('Search Orders')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                  onKeyDown={(e) => e.key === 'Enter' && getUnpaidOrders(searchQuery)}
                />
                <Button onClick={() => getUnpaidOrders(searchQuery)}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {!loading && (
                <>
                  <ScrollArea className="min-h-[150px] flex-1">
                    <div className="flex flex-col gap-3">
                      {unpaidOrders.data?.map((order) => (
                        <OrderCard key={order.id} onOpenChange={onOpenChange} order={order} />
                      ))}
                    </div>
                  </ScrollArea>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => getUnpaidOrders(searchQuery, Math.max(unpaidOrders.page - 1, 1))}
                        />
                      </PaginationItem>
                      {Array.from({ length: unpaidOrders.lastPage }, (_, i) => i + 1).map((num) => (
                        <PaginationItem key={num}>
                          <PaginationLink
                            onClick={() => setUnpaidOrders((prev) => ({ ...prev, page: num }))}
                            isActive={num === unpaidOrders.page}
                          >
                            {num}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            getUnpaidOrders(searchQuery, Math.min(unpaidOrders.page + 1, unpaidOrders.lastPage))
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </>
              )}
              {loading && (
                <div className="flex min-h-[150px] flex-1 items-center justify-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </div>
              )}
            </TabsContent>

            <TabsContent value="partially-paid" className={cn('flex flex-1 flex-col')}>
              <div className="relative flex w-full flex-row items-center gap-2">
                <Input
                  placeholder={t('Search Orders')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                  onKeyDown={(e) => e.key === 'Enter' && getPartiallyPaidOrders(searchQuery)}
                />
                <Button onClick={() => getPartiallyPaidOrders(searchQuery)}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {!loading && (
                <>
                  <ScrollArea className="min-h-[150px] flex-1">
                    <div className="flex h-full flex-col gap-3">
                      {partiallyPaidOrders.data?.map((order) => (
                        <OrderCard key={order.id} onOpenChange={onOpenChange} order={order} />
                      ))}
                    </div>
                  </ScrollArea>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => getPartiallyPaidOrders(searchQuery, Math.max(partiallyPaidOrders.page - 1, 1))}
                        />
                      </PaginationItem>
                      {Array.from({ length: partiallyPaidOrders.lastPage }, (_, i) => i + 1).map((num) => (
                        <PaginationItem key={num}>
                          <PaginationLink
                            onClick={() => setPartiallyPaidOrders((prev) => ({ ...prev, page: num }))}
                            isActive={num === partiallyPaidOrders.page}
                          >
                            {num}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            getPartiallyPaidOrders(
                              searchQuery,
                              Math.min(partiallyPaidOrders.page + 1, partiallyPaidOrders.lastPage),
                            )
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </>
              )}

              {loading && (
                <div className="flex min-h-[150px] flex-1 items-center justify-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </div>
              )}
            </TabsContent>
          </Tabs>

          <ConfirmationDialog
            isOpen={isOpenOrderOpen}
            onClose={() => setIsOpenOrderOpen(false)}
            onConfirm={() => {
              setIsOpenOrderOpen(false);
            }}
            title={t('Confirm Your Action')}
            description={t('The cart is not empty. Opening an order will clear your cart would you proceed?')}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
