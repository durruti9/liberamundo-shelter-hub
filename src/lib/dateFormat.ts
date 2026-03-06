import { differenceInMonths, differenceInDays, format, parse } from 'date-fns';
import { es } from 'date-fns/locale';

/** Format any date string (yyyy-MM-dd or ISO) to DD-MM-AAAA */
export function formatDateES(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T00:00:00');
    return format(d, 'dd-MM-yyyy');
  } catch {
    return dateStr;
  }
}

/** Calculate stay duration from a check-in date to today, returning "Xm Xd" */
export function stayDuration(fechaEntrada: string): string {
  try {
    const start = new Date(fechaEntrada + 'T00:00:00');
    const now = new Date();
    const months = differenceInMonths(now, start);
    const afterMonths = new Date(start);
    afterMonths.setMonth(afterMonths.getMonth() + months);
    const days = differenceInDays(now, afterMonths);
    if (months === 0) return `${days}d`;
    return `${months}m ${days}d`;
  } catch {
    return '—';
  }
}
