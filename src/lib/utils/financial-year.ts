/**
 * Financial year utilities (UK tax year: April 6 to April 5)
 */

export interface FinancialYearPeriod {
  year: string; // e.g., "2024/25"
  startDate: string; // ISO format
  endDate: string; // ISO format
}

/**
 * Get the financial year for a given date
 * UK tax year runs from April 6 to April 5
 */
export function getFinancialYear(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed
  const day = d.getDate();

  // If before April 6, use previous year
  if (month < 3 || (month === 3 && day < 6)) {
    return `${year - 1}/${String(year).slice(2)}`;
  }

  return `${year}/${String(year + 1).slice(2)}`;
}

/**
 * Get the start and end dates for a financial year
 */
export function getFinancialYearPeriod(financialYear: string): FinancialYearPeriod {
  const [startYear] = financialYear.split('/');
  const year = parseInt(startYear);

  return {
    year: financialYear,
    startDate: `${year}-04-06`,
    endDate: `${year + 1}-04-05`
  };
}

/**
 * Get all financial years from a list of dates
 */
export function getAllFinancialYears(dates: (string | Date)[]): string[] {
  const years = new Set<string>();
  dates.forEach(date => {
    years.add(getFinancialYear(date));
  });
  return Array.from(years).sort().reverse(); // Most recent first
}

/**
 * Group items by financial year
 */
export function groupByFinancialYear<T extends { pay_date: string }>(
  items: T[]
): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};

  items.forEach(item => {
    const fy = getFinancialYear(item.pay_date);
    if (!grouped[fy]) {
      grouped[fy] = [];
    }
    grouped[fy].push(item);
  });

  return grouped;
}

/**
 * Format financial year for display
 */
export function formatFinancialYear(fy: string): string {
  const [startYear, endYear] = fy.split('/');
  return `FY ${startYear}/${endYear}`;
}
