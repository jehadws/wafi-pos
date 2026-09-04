'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Customer } from '@/types/models/customer';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';
import { customersApi } from '@/api';
import { Eye, Loader2, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../lib/i18n';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SelectCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCustomer: Customer | null | undefined;
  onViewCustomer: (customer: Customer) => void;
  handleSelectCustomer: (customer: Customer) => void;
}

export function SelectCustomerDialog({ open, onOpenChange, selectedCustomer, handleSelectCustomer, onViewCustomer }: SelectCustomerDialogProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const customers = await customersApi.getRecentlyActive();
      setCustomers(customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) return;
    setLoading(true);
    try {
      const customers = await customersApi.search(query);
      if (customers) {
        setCustomers(customers);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchCustomers();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('flex h-[90vh] max-h-[90vh] w-[50vw] max-w-[50vw] flex-col sm:max-w-[50vw]')}>
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold">{t('Select Customer')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {selectedCustomer && (
            <div className="flex items-center justify-between">
              <span className="text-sm">{t('No Customer Selected')} :</span>
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {selectedCustomer.first_name} {selectedCustomer.last_name || ''}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 rounded-full border p-0"
                  onClick={() => onViewCustomer(selectedCustomer)}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          <div className="relative">
            <Search className="absolute top-1/2 start-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input placeholder={t('Search')} value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="ps-10" />
          </div>

          <ScrollArea className="min-h-0 w-full flex-1">
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-muted-foreground ms-2 text-sm">{t('Loading...')}</span>
              </div>
            ) : customers.length > 0 ? (
              <div className='space-y-2'>
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    className="hover:bg-muted rounded-md border p-3"
                    onClick={() => handleSelectCustomer(customer)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {customer.first_name} {customer.last_name || ''}
                        </div>
                        <div className="text-sm text-gray-500">{customer.phone}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatCurrency(+customer.purchases_amount)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-full border p-0"
                          onClick={() => onViewCustomer(customer)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center">
                {searchQuery ? t('No customer match your query...') : t('No customers has been registered')}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
