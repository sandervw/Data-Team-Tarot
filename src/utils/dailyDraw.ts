interface Dated {
  readonly added: string;
}

const hashDateString = (date: string, offset: number = 0): number => {
  let hash = offset;
  for (let i = 0; i < date.length; i++) {
    const char = date.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
};

// Collapses Tue/Thu/Sat/Sun onto the prior Mon/Wed/Fri so draws only change three times a week.
const getAdjustedDate = (date: Readonly<Date>): Date => {
  const adjusted = new Date(date);
  const day = adjusted.getDay();
  switch (day) {
    case 2:
    case 4:
    case 6:
      adjusted.setDate(adjusted.getDate() - 1);
      break;
    case 0:
      adjusted.setDate(adjusted.getDate() - 2);
      break;
  }
  return adjusted;
};

const getDailyDraw = <T extends Dated>(
  fortunes: readonly T[],
  date: Readonly<Date>,
): T => {
  const adjustedDate = getAdjustedDate(date);
  const drawKey = adjustedDate.toISOString().slice(0, 10);
  const pool = fortunes.filter((f) => f.added <= drawKey);
  const hash = hashDateString(adjustedDate.toDateString(), 1);
  const fortuneIndex = Math.abs(hash) % pool.length;
  return pool[fortuneIndex]!;
};

// function to get previous 9 monday, wednesday, friday dates for cemetery page (excluding most recent day)
const getPreviousDrawDates = (count: number, date: Readonly<Date>): Date[] => {
  const drawDays = [1, 3, 5]; // Mon, Wed, Fri
  const results: Date[] = [];
  const current = getAdjustedDate(date);

  // Step backward from the adjusted date, skipping the current draw day
  const cursor = new Date(current);
  cursor.setDate(cursor.getDate() - 1);

  while (results.length < count) {
    if (drawDays.includes(cursor.getDay())) {
      results.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return results;
};

export { getDailyDraw, getAdjustedDate, getPreviousDrawDates };
