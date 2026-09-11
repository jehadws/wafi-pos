/**
 * tests/integration/sb-crud-form.test.tsx
 *
 * Regression coverage for the `sbCrudForm` inline-create flow (Plan A,
 * A1.4): trigger opens the embedded CRUD form modal, submit posts the
 * `getFlatForm` payload, the created entry becomes the selected option,
 * and a 403 form-config probe hides the trigger.
 */
import { crudApi } from '@/api/crud';
import { SbCrudForm } from '@/components/forms/config-form/sb-crud-form';
import type { CrudFormConfig, FormFieldDef } from '@/types/forms';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), warning: vi.fn(), info: vi.fn(), success: vi.fn() },
}));

vi.mock('@/api/crud', () => ({
  crudApi: {
    formConfig: vi.fn(),
    create: vi.fn(),
  },
}));

const groupConfig: CrudFormConfig = {
  form: {
    main: { name: 'name', label: 'Name', type: 'text', value: '', validation: 'required' },
    tabs: {
      general: {
        identifier: 'general',
        label: 'General',
        fields: [{ name: 'identifier', label: 'Identifier', type: 'text', value: '' }],
      },
    },
  },
  labels: {},
  links: { post: '/api/crud/sb.units-groups' },
  submitMethod: 'post',
  namespace: 'sb.units-groups',
  optionAttributes: { label: 'name', value: 'id' },
  queryParams: {},
  title: 'Create a unit group',
  description: 'Unit groups group units together.',
};

const field: FormFieldDef = {
  name: 'group_id',
  label: 'Group',
  type: 'search-select',
  component: 'sbCrudForm',
  props: groupConfig as unknown as Record<string, unknown>,
  options: [
    { label: 'Weight', value: 1 },
    { label: 'Volume', value: 2 },
  ],
  validation: 'required',
};

describe('components/forms/config-form/sb-crud-form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens the modal with the embedded form config and posts the flat payload on save', async () => {
    const onChange = vi.fn();
    vi.mocked(crudApi.create).mockResolvedValueOnce({
      status: 'success',
      message: 'Created',
      entry: { id: 9, name: 'Pieces' },
    });

    render(<SbCrudForm field={field} value={1} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /Create new Group/ }));

    expect(await screen.findByText('Create a unit group')).toBeTruthy();

    const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Pieces' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(crudApi.create).toHaveBeenCalledWith('sb.units-groups', {
        name: 'Pieces',
        general: { identifier: '' },
      });
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(9, { id: 9, name: 'Pieces' });
    });
  });

  it('surfaces 422 server errors inline and keeps the modal open', async () => {
    const onChange = vi.fn();
    const axiosError = {
      response: {
        status: 422,
        data: { message: 'The name has already been taken.', errors: { name: ['The name has already been taken.'] } },
      },
    };
    vi.mocked(crudApi.create).mockRejectedValueOnce(axiosError);

    render(<SbCrudForm field={field} value={1} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /Create new Group/ }));
    expect(await screen.findByText('Create a unit group')).toBeTruthy();

    // The client-side subset gates first: fill the required name,
    // then submit so the request actually fires.
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Pieces' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByText('The name has already been taken.')).toBeTruthy();
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('hides the trigger permanently when the form-config probe fails (403)', async () => {
    const onChange = vi.fn();
    vi.mocked(crudApi.formConfig).mockRejectedValueOnce({ response: { status: 403 } });

    const fetchOnlyField: FormFieldDef = {
      ...field,
      props: undefined,
      namespace: 'sb.units-groups',
    } as FormFieldDef;

    render(<SbCrudForm field={fetchOnlyField} value={1} onChange={onChange} />);

    const trigger = screen.getByRole('button', { name: /Create new Group/ });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Create new Group/ })).toBeNull();
    });
    expect(crudApi.formConfig).toHaveBeenCalledWith('sb.units-groups');
  });

  it('renders no trigger when disabled', () => {
    const onChange = vi.fn();
    render(<SbCrudForm field={field} value={1} onChange={onChange} disabled />);
    expect(screen.queryByRole('button', { name: /Create new Group/ })).toBeNull();
  });
});
