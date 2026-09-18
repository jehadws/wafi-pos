/**
 * custom-sections.test.tsx
 *
 * Unit coverage for the declarative root custom-section mechanism (Phase 2
 * of `docs/plans/backend-driven-completion`): a root key of `config.form`
 * whose value carries a `component` string is seeded from `value`, rendered
 * through the custom-component registry, and emitted on submit with client
 * bookkeeping keys (`_key`/`$invalid`/`_clientId`) and phantom ids stripped.
 * The legacy `rules` array (RewardSystemCrud) keeps its back-compat path.
 */
import type { CrudFormConfig } from '@/types/forms';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigForm, buildCrudPayload, getRootCustomSectionKeys, initialValuesFromConfig } from './config-form';
import { clearCustomComponents, registerCustomComponent, type CustomFieldComponentProps } from './registry';

const translate = (key: string) => key;

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ t: translate }),
}));

const productsConfig: CrudFormConfig = {
  form: {
    main: { name: 'name', label: 'Name', type: 'text', value: 'PO-1' },
    tabs: {
      general: {
        identifier: 'general',
        label: 'General',
        fields: [{ name: 'invoice_reference', label: 'Invoice Number', type: 'text', value: '' }],
      },
    },
    products: {
      component: 'procurementProducts',
      taxGroups: [{ id: 3, name: 'VAT', taxes: [{ id: 1, rate: 10 }] }],
      value: [{ _key: 'row-1', product_id: 5, name: 'Flour', quantity: 2, unit_id: 1 }],
    },
  },
  labels: {},
  links: { post: '/api/crud/sb.procurements' },
  submitMethod: 'post',
  namespace: 'sb.procurements',
  optionAttributes: { label: 'name', value: 'id' },
  queryParams: {},
  title: 'Procurement',
  description: '',
};

const legacyRulesConfig: CrudFormConfig = {
  form: {
    main: { name: 'name', label: 'Name', type: 'text', value: 'Reward 1' },
    tabs: {},
    rules: [
      [
        { name: 'id', value: 7 },
        { name: 'from', value: 10 },
        { name: 'to', value: 20 },
      ],
    ],
    ruleForm: [{ name: 'id', type: 'hidden' }],
  },
  labels: {},
  links: { post: '/api/crud/sb.rewards' },
  submitMethod: 'post',
  namespace: 'sb.rewards',
  optionAttributes: { label: 'name', value: 'id' },
  queryParams: {},
  title: 'Reward',
  description: '',
};

describe('root custom sections — declarative shape', () => {
  beforeEach(() => {
    clearCustomComponents();
  });

  it('detects root keys carrying a component string and ignores main/tabs/plain arrays', () => {
    expect(getRootCustomSectionKeys(productsConfig.form)).toEqual(['products']);
    expect(getRootCustomSectionKeys({ main: null, tabs: {} })).toEqual([]);
    expect(getRootCustomSectionKeys(legacyRulesConfig.form)).toEqual([]);
  });

  it('seeds values from the section `value`', () => {
    const values = initialValuesFromConfig(productsConfig);
    expect(values['products']).toEqual([{ _key: 'row-1', product_id: 5, name: 'Flour', quantity: 2, unit_id: 1 }]);
  });

  it('seeds an empty array when the section declares no `value`', () => {
    const config = {
      ...productsConfig,
      form: { ...productsConfig.form, products: { component: 'procurementProducts' } },
    };
    expect(initialValuesFromConfig(config)['products']).toEqual([]);
  });

  it('emits section rows with _key/$invalid/client ids stripped and real ids kept', () => {
    const values = {
      name: 'PO-1',
      'general.invoice_reference': 'INV-1',
      products: [
        { _key: 'row-1', $invalid: false, id: 'client_1', product_id: 5, name: 'Flour', quantity: 2 },
        { _key: 'row-2', $invalid: true, id: 45, product_id: 6, name: 'Sugar', quantity: 0 },
        { _key: 'row-3', id: 1737055200000, product_id: 7, name: 'Salt', quantity: 1 },
      ],
    };
    const payload = buildCrudPayload(productsConfig, values);
    expect(payload['products']).toEqual([
      { product_id: 5, name: 'Flour', quantity: 2 },
      { id: 45, product_id: 6, name: 'Sugar', quantity: 0 },
      { product_id: 7, name: 'Salt', quantity: 1 },
    ]);
  });

  it('renders the registered component with section extras as field.props and wires onChange', () => {
    registerCustomComponent('procurementProducts', ({ field, value, onChange, error }: CustomFieldComponentProps) => (
      <button type="button" data-testid="products-fake" onClick={() => onChange([...(value as Array<Record<string, unknown>>), { product_id: 9 }])}>
        {`${field.name}:${(field.props?.taxGroups as Array<{ id: number }>).length}:${error ?? 'no-error'}`}
      </button>
    ));

    const onFieldChange = vi.fn();
    render(
      <ConfigForm
        config={productsConfig}
        values={initialValuesFromConfig(productsConfig)}
        onFieldChange={onFieldChange}
        errors={{ products: 'A row is invalid' }}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByTestId('products-fake').textContent).toBe('products:1:A row is invalid');

    fireEvent.click(screen.getByTestId('products-fake'));
    expect(onFieldChange).toHaveBeenCalledWith('products', [
      { _key: 'row-1', product_id: 5, name: 'Flour', quantity: 2, unit_id: 1 },
      { product_id: 9 },
    ]);
  });

  it('hides an unregistered root section and warns instead of crashing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<ConfigForm config={productsConfig} values={{}} onFieldChange={vi.fn()} onSubmit={vi.fn()} />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('procurementProducts'));
    expect(screen.queryByTestId('products-fake')).toBeNull();
    warn.mockRestore();
  });
});

describe('root custom sections — legacy rules back-compat', () => {
  beforeEach(() => {
    clearCustomComponents();
  });

  it('seeds kv-pair rule rows into objects (unchanged)', () => {
    const values = initialValuesFromConfig(legacyRulesConfig);
    expect(values['rules']).toEqual([{ id: 7, from: 10, to: 20 }]);
  });

  it('renders the legacy rules array through the registered rules component', () => {
    registerCustomComponent('rules', ({ value }: CustomFieldComponentProps) => (
      <div data-testid="rules-fake">{(value as Array<Record<string, unknown>>).length}</div>
    ));

    render(
      <ConfigForm config={legacyRulesConfig} values={initialValuesFromConfig(legacyRulesConfig)} onFieldChange={vi.fn()} onSubmit={vi.fn()} />,
    );

    expect(screen.getByTestId('rules-fake').textContent).toBe('1');
  });

  it('emits legacy rules with _clientId and phantom ids stripped (unchanged)', () => {
    const payload = buildCrudPayload(legacyRulesConfig, {
      name: 'Reward 1',
      rules: [
        { id: 7, from: 10, to: 20 },
        { _clientId: 'rule-temp', from: 21, to: 30 },
        { id: 'client_9', from: 31, to: 40 },
      ],
    });
    expect(payload['rules']).toEqual([
      { id: 7, from: 10, to: 20 },
      { from: 21, to: 30 },
      { from: 31, to: 40 },
    ]);
  });
});

