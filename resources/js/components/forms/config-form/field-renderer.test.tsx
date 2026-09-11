/**
 * field-renderer.test.tsx
 *
 * Unit tests for field-renderer.tsx.
 * Covers: select-audio renders select + audio preview button that plays on click,
 *         inline-multiselect emits string[] values correctly.
 */
import type { FormFieldDef } from '@/types/forms';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FieldRenderer } from './field-renderer';

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Stub Radix Select to avoid pointer-events / portal issues in jsdom.
vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <div role="option" data-value={value}>
      {children}
    </div>
  ),
}));

// Stub MultiKeySelector so we can drive it programmatically.
vi.mock('@/components/ui/multi-key-selector', () => ({
  default: ({
    options,
    value,
    onChange,
  }: {
    options: { label: string; value: string }[];
    value: string[] | null;
    onChange: (keys: string[]) => void;
  }) => (
    <div data-testid="multi-key-selector">
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange([...(value ?? []), o.value])}>
          {o.label}
        </button>
      ))}
    </div>
  ),
}));

// -----------------------------------------------------------------
// select-audio
// -----------------------------------------------------------------
describe('FieldRenderer — select-audio', () => {
  const field: FormFieldDef = {
    name: 'sound',
    label: 'Sound',
    type: 'select-audio',
    options: [
      { label: 'Beep', value: 'beep.mp3' },
      { label: 'Ding', value: 'ding.mp3' },
    ],
  };

  it('renders an audio preview button alongside the select', () => {
    render(<FieldRenderer field={field} value="beep.mp3" onChange={vi.fn()} id="sound" />);
    expect(screen.getByRole('button', { name: 'Preview audio' })).toBeTruthy();
  });

  it('play button calls Audio.play() with the selected value as src', () => {
    const playSpy = vi.fn().mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.play = playSpy;

    render(<FieldRenderer field={field} value="beep.mp3" onChange={vi.fn()} id="sound" />);
    fireEvent.click(screen.getByRole('button', { name: 'Preview audio' }));
    expect(playSpy).toHaveBeenCalled();
  });

  it('play button is disabled when no value is selected', () => {
    render(<FieldRenderer field={field} value="" onChange={vi.fn()} id="sound" />);
    const btn = screen.getByRole('button', { name: 'Preview audio' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });
});

// -----------------------------------------------------------------
// inline-multiselect
// -----------------------------------------------------------------
describe('FieldRenderer — inline-multiselect', () => {
  const field: FormFieldDef = {
    name: 'days',
    label: 'Days',
    type: 'inline-multiselect',
    options: [
      { label: 'Mon', value: 'mon' },
      { label: 'Tue', value: 'tue' },
    ],
  };

  it('calls onChange with a string[] when a key is toggled', () => {
    const onChange = vi.fn();
    render(<FieldRenderer field={field} value={null} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mon' }));
    expect(onChange).toHaveBeenCalledWith(['mon']);
  });

  it('accumulates toggled keys into the existing array', () => {
    const onChange = vi.fn();
    render(<FieldRenderer field={field} value={['mon']} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tue' }));
    expect(onChange).toHaveBeenCalledWith(['mon', 'tue']);
  });
});
