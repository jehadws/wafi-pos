import { beforeEach, describe, expect, it, vi } from 'vitest';
import { transactionsApi } from '@/api/transactions';
import * as http from '@/api/http';

describe('transactionsApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getRules calls /transactions/rules', async () => {
        const spy = vi.spyOn(http, 'get').mockResolvedValueOnce({ rules: [] } as any);
        const result = await transactionsApi.getRules();
        expect(spy).toHaveBeenCalledWith('/transactions/rules');
        expect(result).toEqual({ rules: [] });
    });

    it('createRule posts to /transactions/rules with payload', async () => {
        const spy = vi.spyOn(http, 'post').mockResolvedValueOnce({ message: 'Created' } as any);
        const ruleData = { name: 'Auto Expense Rule', trigger: 'on_sale' };
        const result = await transactionsApi.createRule(ruleData);
        expect(spy).toHaveBeenCalledWith('/transactions/rules', { rule: ruleData });
        expect(result).toEqual({ message: 'Created' });
    });

    it('deleteRule sends DELETE request to /transactions/rules/:id', async () => {
        const spy = vi.spyOn(http, 'del').mockResolvedValueOnce({ message: 'Deleted' } as any);
        const result = await transactionsApi.deleteRule(42);
        expect(spy).toHaveBeenCalledWith('/transactions/rules/42');
        expect(result).toEqual({ message: 'Deleted' });
    });

    it('getAccounts calls /transactions-accounts', async () => {
        const spy = vi.spyOn(http, 'get').mockResolvedValueOnce([{ id: 1, name: 'Cash Drawer' }] as any);
        const result = await transactionsApi.getAccounts();
        expect(spy).toHaveBeenCalledWith('/transactions-accounts');
        expect(result).toHaveLength(1);
    });

    it('getCategoryIdentifier sends post with exclude and identifier', async () => {
        const spy = vi.spyOn(http, 'post').mockResolvedValueOnce({ subAccounts: [] } as any);
        await transactionsApi.getCategoryIdentifier('sales_income', 5);
        expect(spy).toHaveBeenCalledWith('/transactions-accounts/category-identifier', {
            identifier: 'sales_income',
            exclude: 5,
        });
    });

    it('resetAccountDefaults calls /transactions-accounts/reset-defaults', async () => {
        const spy = vi.spyOn(http, 'get').mockResolvedValueOnce({ status: 'ok' } as any);
        await transactionsApi.resetAccountDefaults();
        expect(spy).toHaveBeenCalledWith('/transactions-accounts/reset-defaults');
    });

    it('getConfigurations calls /transactions/configurations', async () => {
        const spy = vi.spyOn(http, 'get').mockResolvedValueOnce({ configs: {} } as any);
        await transactionsApi.getConfigurations();
        expect(spy).toHaveBeenCalledWith('/transactions/configurations');
    });
});
