/**
 * auth-form-shell.test.tsx
 *
 * Vitest coverage for AuthFormShell:
 *  1. Renders field labels + correct input types from FormFieldDef[]
 *  2. Initial values populate into rendered inputs
 *  3. Checkbox field renders correctly
 *  4. External validation errors appear beneath the field
 *  5. Submit fires the correct method + URL via Inertia useForm
 */
import { AuthFormShell } from './auth-form-shell';
import type { FormFieldDef } from '@/types/forms';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks (vi.hoisted ensures these are declared BEFORE vi.mock hoisting runs)
// ---------------------------------------------------------------------------

const { mockPost, mockPut, mockSetData, mockClearErrors, mockRouterVisit } = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockPut: vi.fn(),
  mockSetData: vi.fn(),
  mockClearErrors: vi.fn(),
  mockRouterVisit: vi.fn(),
}));

vi.mock('@inertiajs/react', () => ({
  useForm: <T extends Record<string, unknown>>(initial: T) => {
    const dataStore: Record<string, unknown> = { ...initial };
    const errorsStore: Record<string, string> = {};
    return {
      data: dataStore,
      setData: (key: string, value: unknown) => {
        dataStore[key] = value;
        mockSetData(key, value);
      },
      post: mockPost,
      put: mockPut,
      processing: false,
      errors: errorsStore,
      reset: vi.fn(),
      clearErrors: mockClearErrors,
    };
  },
  router: {
    visit: mockRouterVisit,
  },
}));

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({
    id,
    checked,
    onCheckedChange,
    disabled,
  }: {
    id?: string;
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
  }) => (
    <input
      id={id}
      type="checkbox"
      checked={Boolean(checked)}
      disabled={disabled}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
    />
  ),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <div role="option" data-value={value}>
      {children}
    </div>
  ),
}));

// ---------------------------------------------------------------------------
// Test setup helpers
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockPost.mockReset();
  mockPut.mockReset();
  mockSetData.mockReset();
  mockClearErrors.mockReset();
  mockRouterVisit.mockReset();
});

// ---------------------------------------------------------------------------
// Test 1 — Renders field labels + correct input types from FormFieldDef[]
// ---------------------------------------------------------------------------
describe('AuthFormShell — renders labels and input types', () => {
  it('renders text + password fields with correct labels and types', () => {
    const fields: FormFieldDef[] = [
      { name: 'username', label: 'Username', type: 'text' },
      { name: 'password', label: 'Password', type: 'password' },
    ];

    render(<AuthFormShell fields={fields} submitUrl="/test" />);

    const usernameInput = screen.getByLabelText('Username') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;

    expect(usernameInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(usernameInput.type).toBe('text');
    expect(passwordInput.type).toBe('password');
  });
});

// ---------------------------------------------------------------------------
// Test 2 — Initial values populate into rendered inputs
// ---------------------------------------------------------------------------
describe('AuthFormShell — initial values', () => {
  it('populates initialValues.email into the rendered email input', () => {
    const fields: FormFieldDef[] = [
      { name: 'email', label: 'Email', type: 'email' },
    ];

    render(
      <AuthFormShell
        fields={fields}
        initialValues={{ email: 'foo@bar.com' }}
        submitUrl="/test"
      />,
    );

    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    expect(emailInput.value).toBe('foo@bar.com');
  });

  it('falls back to field.default when initialValues is absent', () => {
    const fields: FormFieldDef[] = [
      { name: 'role', label: 'Role', type: 'text', default: 'cashier' },
    ];

    render(<AuthFormShell fields={fields} submitUrl="/test" />);

    const roleInput = screen.getByLabelText('Role') as HTMLInputElement;
    expect(roleInput.value).toBe('cashier');
  });
});

// ---------------------------------------------------------------------------
// Test 3 — Checkbox field renders
// ---------------------------------------------------------------------------
describe('AuthFormShell — checkbox support', () => {
  it('renders a native checkbox input for type==="checkbox"', () => {
    const fields: FormFieldDef[] = [
      { name: 'remember', label: 'Remember me', type: 'checkbox' },
    ];

    render(<AuthFormShell fields={fields} submitUrl="/test" />);

    const checkbox = screen.getByLabelText('Remember me') as HTMLInputElement;
    expect(checkbox.type).toBe('checkbox');
    expect(checkbox.checked).toBe(false);
  });

  it('seeds checkbox checked=true from initialValues', () => {
    const fields: FormFieldDef[] = [
      { name: 'remember', label: 'Remember me', type: 'checkbox' },
    ];

    render(
      <AuthFormShell
        fields={fields}
        initialValues={{ remember: true }}
        submitUrl="/test"
      />,
    );

    const checkbox = screen.getByLabelText('Remember me') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test 4 — External validation errors display
// ---------------------------------------------------------------------------
describe('AuthFormShell — external errors override', () => {
  it('renders the error string beneath the field with matching name', () => {
    const fields: FormFieldDef[] = [
      { name: 'username', label: 'Username', type: 'text' },
    ];

    render(
      <AuthFormShell
        fields={fields}
        submitUrl="/test"
        errors={{ username: 'Username is required.' }}
      />,
    );

    expect(screen.getByText('Username is required.')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Test 5 — Submit fires correct method + URL
// ---------------------------------------------------------------------------
describe('AuthFormShell — submit dispatch', () => {
  it('calls form.post with exact submitUrl on submit button click', async () => {
    const user = userEvent.setup();
    const fields: FormFieldDef[] = [
      { name: 'email', label: 'Email', type: 'email' },
    ];

    render(
      <AuthFormShell
        fields={fields}
        submitUrl="/api/test-login"
        submitMethod="post"
        submitLabel="Sign in"
      />,
    );

    const button = screen.getByRole('button', { name: /Sign in/i });
    await user.click(button);

    expect(mockClearErrors).toHaveBeenCalled();
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost.mock.calls[0][0]).toBe('/api/test-login');
    expect(mockPut).not.toHaveBeenCalled();
  });

  it('calls form.put when submitMethod="put"', async () => {
    const user = userEvent.setup();
    const fields: FormFieldDef[] = [
      { name: 'password', label: 'Password', type: 'password' },
    ];

    render(
      <AuthFormShell
        fields={fields}
        submitUrl="/api/reset-password"
        submitMethod="put"
      />,
    );

    const button = screen.getByRole('button', { name: /Submit/i });
    await user.click(button);

    expect(mockPut).toHaveBeenCalledTimes(1);
    expect(mockPut.mock.calls[0][0]).toBe('/api/reset-password');
    expect(mockPost).not.toHaveBeenCalled();
  });
});
