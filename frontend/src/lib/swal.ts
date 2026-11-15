import Swal from 'sweetalert2';

function getSwalThemeOptions() {
  const isDark =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark');

  return {
    background: isDark ? '#0f172a' : '#ffffff',
    color: isDark ? '#f1f5f9' : '#0f172a',
    cancelButtonColor: isDark ? '#334155' : '#64748b',
  };
}

export async function confirmDelete(options: {
  title?: string;
  text: string;
  confirmText?: string;
}): Promise<boolean> {
  const theme = getSwalThemeOptions();
  const result = await Swal.fire({
    title: options.title || 'Konfirmasi Hapus',
    text: options.text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e11d48',
    cancelButtonColor: theme.cancelButtonColor,
    confirmButtonText: options.confirmText || 'Ya, Hapus!',
    cancelButtonText: 'Batal',
    reverseButtons: true,
    background: theme.background,
    color: theme.color,
  });
  return result.isConfirmed;
}

export async function confirmUpdate(options: {
  title?: string;
  text: string;
  confirmText?: string;
}): Promise<boolean> {
  const theme = getSwalThemeOptions();
  const result = await Swal.fire({
    title: options.title || 'Konfirmasi Simpan Perubahan',
    text: options.text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#d97706',
    cancelButtonColor: theme.cancelButtonColor,
    confirmButtonText: options.confirmText || 'Ya, Simpan!',
    cancelButtonText: 'Batal',
    reverseButtons: true,
    background: theme.background,
    color: theme.color,
  });
  return result.isConfirmed;
}

export async function promptInput(options: {
  title: string;
  text?: string;
  inputLabel?: string;
  inputValue?: string;
  placeholder?: string;
  inputType?: 'text' | 'number' | 'textarea';
  confirmText?: string;
  confirmColor?: string;
  icon?: 'warning' | 'question' | 'info';
  validator?: (value: string) => string | null;
}): Promise<string | null> {
  const theme = getSwalThemeOptions();
  const result = await Swal.fire({
    title: options.title,
    text: options.text,
    input: options.inputType || 'text',
    inputLabel: options.inputLabel,
    inputValue: options.inputValue ?? '',
    inputPlaceholder: options.placeholder || '',
    icon: options.icon || 'question',
    showCancelButton: true,
    confirmButtonColor: options.confirmColor || '#d97706',
    cancelButtonColor: theme.cancelButtonColor,
    confirmButtonText: options.confirmText || 'Lanjutkan',
    cancelButtonText: 'Batal',
    reverseButtons: true,
    background: theme.background,
    color: theme.color,
    inputValidator: (value) => {
      if (options.validator) {
        return options.validator(value) || undefined;
      }
      if (!value || !String(value).trim()) {
        return 'Input tidak boleh kosong';
      }
      return undefined;
    },
  });

  if (!result.isConfirmed) return null;
  return String(result.value ?? '');
}
