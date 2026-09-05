'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Customer } from '@/types/models/customer';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';
import { customersApi } from '@/api';
import { Eye, Loader2, Plus, Search, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../lib/i18n';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SelectCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCustomer: Customer | null | undefined;
  onViewCustomer: (customer: Customer) => void;
  handleSelectCustomer: (customer: Customer) => void;
  defaultCreateMode?: boolean;
}

export function SelectCustomerDialog({
  open,
  onOpenChange,
  selectedCustomer,
  handleSelectCustomer,
  onViewCustomer,
  defaultCreateMode = false,
}: SelectCustomerDialogProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [createMode, setCreateMode] = useState(defaultCreateMode);
  const [creating, setCreating] = useState(false);
  const [groups, setGroups] = useState<Array<{ id: number | string; name: string }>>([]);
  const [groupId, setGroupId] = useState<string>('');
  const [newCustomer, setNewCustomer] = useState({ first_name: '', last_name: '', phone: '', email: '' });

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

  const fetchGroups = async () => {
    try {
      const data = await customersApi.getGroups();
      if (Array.isArray(data) && data.length > 0) {
        setGroups(data);
        if (!groupId) setGroupId(String(data[0].id));
      }
    } catch {
      // Groups unavailable — leave selector empty
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

  const handleCreateCustomer = async () => {
    if (!newCustomer.first_name.trim()) {
      toast.error(t('First name is required'));
      return;
    }
    if (!newCustomer.phone.trim()) {
      toast.error(t('Phone number is required'));
      return;
    }
    if (!groupId) {
      toast.error(t('Group is required'));
      return;
    }

    setCreating(true);
    try {
      const created = await customersApi.create({
        first_name: newCustomer.first_name.trim(),
        general: {
          last_name: newCustomer.last_name.trim(),
          phone: newCustomer.phone.trim(),
          email: newCustomer.email.trim(),
          group_id: groupId,
        },
      });
      toast.success(t('Customer created successfully'));
      setNewCustomer({ first_name: '', last_name: '', phone: '', email: '' });
      setCreateMode(false);
      // Auto-select the newly created customer
      if (created && created.id) {
        handleSelectCustomer(created as Customer);
      } else {
        fetchCustomers();
      }
    } catch {
      toast.error(t('Failed to create customer'));
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchCustomers();
      setCreateMode(defaultCreateMode);
      if (defaultCreateMode) fetchGroups();
    }
  }, [open, defaultCreateMode]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('flex h-[90vh] max-h-[90vh] w-[50vw] max-w-[50vw] flex-col sm:max-w-[50vw]')}>
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold">
            {createMode ? t('Create Customer') : t('Select Customer')}
          </DialogTitle>
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

          {createMode ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs">{t('First Name')} *</label>
                  <Input
                    placeholder={t('First Name')}
                    value={newCustomer.first_name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs">{t('Last Name')}</label>
                  <Input
                    placeholder={t('Last Name')}
                    value={newCustomer.last_name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-muted-foreground mb-1 block text-xs">{t('Phone')} *</label>
                <Input
                  placeholder={t('Phone')}
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-muted-foreground mb-1 block text-xs">{t('Email')}</label>
                <Input
                  placeholder={t('Email')}
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-muted-foreground mb-1 block text-xs">{t('Group')} *</label>
                <Select value={groupId} onValueChange={setGroupId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('Select a group')} />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={String(g.id)}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setCreateMode(false)} type="button">
                  {t('Cancel')}
                </Button>
                <Button className="flex-1" onClick={handleCreateCustomer} disabled={creating} type="button">
                  {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  {t('Create')}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute top-1/2 start-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                  <Input placeholder={t('Search')} value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="ps-10" />
                </div>
                <Button variant="outline" size="icon" className="shrink-0" onClick={() => { setCreateMode(true); fetchGroups(); }} type="button" title={t('Create Customer')}>
                  <Plus className="h-4 w-4" />
                </Button>
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
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
