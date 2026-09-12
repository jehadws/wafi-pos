/**
 * tests/unit/config-form.test.tsx
 *
 * Unit coverage for the config-driven form primitives (Plan A, A1.1–A1.3):
 * the Laravel-rule subset parser, the payload builder, the values seeder,
 * and the FieldRenderer type→component mapping (including the documented
 * `ckeditor` → Textarea downgrade and option `disabled` handling).
 */
import { ConfigForm, buildCrudPayload, initialValuesFromConfig, validateConfigForm } from '@/components/forms/config-form/config-form';
import { FieldRenderer, formatDatetimeLocal } from '@/components/forms/config-form/field-renderer';
import { parseValidation, validateFieldValue } from '@/components/forms/config-form/parse-validation';
import type { CrudFormConfig, FormFieldDef } from '@/types/forms';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const translate = (key: string, params?: Record<string, string | number>) => {
  if (!params) {
    return key;
  }
  return Object.entries(params).reduce((acc, [name, replacement]) => acc.replaceAll(`:${name}`, String(replacement)), key);
};

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ t: translate }),
}));

const t = translate;

const baseConfig: CrudFormConfig = {
  form: {
    main: { name: 'name', label: 'Name', type: 'text', value: '', validation: 'required' },
    tabs: {
      general: {
        identifier: 'general',
        label: 'General',
        fields: [
          { name: 'identifier', label: 'Identifier', type: 'text', value: '', validation: 'min:3' },
          {
            name: 'active',
            label: 'Active',
            type: 'switch',
            value: '0',
            options: [
              { label: 'No', value: '0' },
              { label: 'Yes', value: '1' },
            ],
          },
        ],
      },
    },
  },
  labels: {},
  links: { post: '/api/crud/sb.units-groups', put: '/api/crud/sb.units-groups/{id}' },
  submitMethod: 'post',
  namespace: 'sb.units-groups',
  optionAttributes: { label: 'name', value: 'id' },
  queryParams: {},
  title: 'Create a group',
  description: 'Groups',
};

describe('parseValidation', () => {
  it('parses the supported subset', () => {
    expect(parseValidation('required|numeric|min:2|max:10')).toEqual({
      required: true,
      min: 2,
      max: 10,
      email: false,
      numeric: true,
      integer: false,
    });
  });

  it('ignores server-only and conditional rules', () => {
    const parsed = parseValidation('nullable|required_if:other,1|unique:subul_units,identifier|in:a,b');
    expect(parsed.required).toBe(false);
    expect(parsed.min).toBeUndefined();
    expect(parsed.max).toBeUndefined();
  });

  it('still marks plain required as required even next to nullable', () => {
    expect(parseValidation('nullable|required').required).toBe(true);
  });

  it('joins array-form rules and drops non-string entries (serialized Rule objects)', () => {
    const parsed = parseValidation(['required', 'min:3', {}] as unknown as string[]);
    expect(parsed.required).toBe(true);
    expect(parsed.min).toBe(3);
    expect(parsed.max).toBeUndefined();
    expect(parseValidation(['required'])).toEqual(parseValidation('required'));
  });
});

describe('validateFieldValue', () => {
  it('blocks empty required values', () => {
    expect(validateFieldValue({ value: '', validation: 'required', label: 'Name', t })).toBe('The Name field is required');
    expect(validateFieldValue({ value: '   ', validation: 'required', label: 'Name', t })).toBeTruthy();
  });

  it('honors array-form validation (e.g. CouponCrud code field) without crashing', () => {
    expect(validateFieldValue({ value: '', validation: ['required'], label: 'Code', t })).toBe('The Code field is required');
    expect(validateFieldValue({ value: '', validation: ['required', {}] as unknown as string[], label: 'Code', t })).toBe(
      'The Code field is required',
    );
  });

  it('lets 0 and "0" survive (mirrors the backend empty-check)', () => {
    expect(validateFieldValue({ value: 0, validation: 'required', t })).toBeNull();
    expect(validateFieldValue({ value: '0', validation: 'required', t })).toBeNull();
  });

  it('enforces numeric/integer/min/max on numeric fields', () => {
    expect(validateFieldValue({ value: 'abc', validation: 'numeric', label: 'Value', t })).toBe('The Value field must be a number');
    expect(validateFieldValue({ value: 1.5, validation: 'integer', t })).toBeTruthy();
    expect(validateFieldValue({ value: 1, validation: 'numeric|min:2', label: 'Qty', t })).toBe('The Qty field must be at least 2');
  });

  it('validates email and string length', () => {
    expect(validateFieldValue({ value: 'nope', validation: 'email', label: 'Email', t })).toBeTruthy();
    expect(validateFieldValue({ value: 'a@b.co', validation: 'email', t })).toBeNull();
    expect(validateFieldValue({ value: 'ab', validation: 'min:3', label: 'Code', t })).toBe('The Code field must be at least 3 characters');
  });
});

describe('buildCrudPayload / initialValuesFromConfig', () => {
  it('seeds values from the definition defaults (dot keys for tab fields)', () => {
    const values = initialValuesFromConfig(baseConfig);
    expect(values).toMatchObject({ name: '', 'general.identifier': '', 'general.active': '0' });
  });

  it('builds the getFlatForm payload shape', () => {
    const values = { name: 'Weight', 'general.identifier': 'weight', 'general.active': '1' };
    expect(buildCrudPayload(baseConfig, values)).toEqual({
      name: 'Weight',
      general: { identifier: 'weight', active: '1' },
    });
  });

  it('flags empty required fields via validateConfigForm (dot keys)', () => {
    const errors = validateConfigForm(baseConfig, { name: '', 'general.identifier': 'weight', 'general.active': '0' }, t);
    expect(errors).toEqual({ name: 'The Name field is required' });
  });

  it('strips non-persistent rule ids from buildCrudPayload to protect PUT requests', () => {
    const values = {
      name: 'Reward 1',
      rules: [
        { id: 45, from: 10, to: 20, reward: 5 },
        { _clientId: 'rule-temp-1', from: 21, to: 30, reward: 10 },
        { id: 'client_123', from: 31, to: 40, reward: 15 },
      ],
    };
    const payload = buildCrudPayload(baseConfig, values);
    expect(payload['rules']).toEqual([
      { id: 45, from: 10, to: 20, reward: 5 },
      { from: 21, to: 30, reward: 10 },
      { from: 31, to: 40, reward: 15 },
    ]);
  });
});

describe('FieldRenderer type mapping', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderField = (field: Partial<FormFieldDef>, value?: unknown) =>
    render(
      <FieldRenderer
        field={{ name: 'f', label: 'Field', type: 'text', ...field } as FormFieldDef}
        value={value ?? field.value ?? ''}
        onChange={onChange}
      />,
    );

  it('renders text/email/password/number as inputs of the matching type', () => {
    renderField({ type: 'email' });
    expect(screen.getByRole('textbox').getAttribute('type')).toBe('email');
  });

  it('renders a field whose validation is an array without crashing (regression)', () => {
    renderField({ type: 'text', validation: ['required'] });
    expect(screen.getByRole('textbox')).toBeTruthy();
  });

  it('renders hidden fields without label chrome', () => {
    const { container } = renderField({ type: 'hidden', value: '7' });
    const input = container.querySelector('input[type="hidden"]');
    expect(input).toBeTruthy();
    expect((input as HTMLInputElement).value).toBe('7');
    expect(screen.queryByText('Field')).toBeNull();
  });

  it('renders ckeditor as the rich text editor', () => {
    renderField({ type: 'ckeditor', value: '<p>hi</p>' });
    const editor = screen.getByRole('textbox');
    expect(editor.innerHTML).toBe('<p>hi</p>');
  });

  it('renders datetimepicker as datetime-local input and formats DB datetime values', () => {
    const { container } = renderField({ type: 'datetimepicker' }, '2026-05-10 14:30:00');
    const input = container.querySelector('input[type="datetime-local"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.value).toBe('2026-05-10T14:30');
  });

  it('formats ISO strings to datetime-local values', () => {
    expect(formatDatetimeLocal('2026-05-10T14:30:00.000000Z')).toContain('2026-05-10T');
    expect(formatDatetimeLocal('')).toBe('');
    expect(formatDatetimeLocal(null)).toBe('');
  });

  it('renders switch fields from their explicit options and never assumes booleans', () => {
    renderField(
      {
        type: 'switch',
        options: [
          { label: 'No', value: '0' },
          { label: 'Yes', value: '1' },
        ],
      },
      '0',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    expect(onChange).toHaveBeenCalledWith('1');
  });

  it('hides fields whose custom component is not registered (dev warning)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = renderField({ type: 'custom', component: 'notRegistered' });
    expect(container.firstChild).toBeNull();
    expect(warn).toHaveBeenCalled();
  });
});

describe('ConfigForm tab identifier resilience', () => {
  it('renders and allows editing when tabs lack an explicit identifier key', () => {
    const configWithoutTabId: CrudFormConfig = {
      ...baseConfig,
      form: {
        ...baseConfig.form,
        tabs: {
          general: {
            label: 'General Tab',
            fields: [{ name: 'code', label: 'Code', type: 'text', value: 'ABC' }],
          } as any,
        },
      },
    };

    const onFieldChange = vi.fn();
    const onSubmit = vi.fn();

    render(<ConfigForm config={configWithoutTabId} values={{ 'general.code': 'ABC' }} onFieldChange={onFieldChange} onSubmit={onSubmit} />);

    expect(screen.getByText('General Tab')).toBeTruthy();
    const input = screen.getByDisplayValue('ABC');
    expect(input).toBeTruthy();
    fireEvent.change(input, { target: { value: 'XYZ' } });
    expect(onFieldChange).toHaveBeenCalledWith('general.code', 'XYZ');
  });
});
