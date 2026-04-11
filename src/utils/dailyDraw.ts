interface DailyDraw {
  readonly cardIndex: number;
  readonly fortuneIndex: number;
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

const getDailyDraw = (
  totalCards: number,
  totalFortunes: number,
  date: Readonly<Date>,
): DailyDraw => {
  const adjustedDate = getAdjustedDate(date);
  const dateKey = adjustedDate.toDateString();
  const cardHash = hashDateString(dateKey);
  const fortuneHash = hashDateString(dateKey, 1);
  const cardIndex = Math.abs(cardHash) % totalCards;
  const fortuneIndex = Math.abs(fortuneHash) % totalFortunes;
  return { cardIndex, fortuneIndex };
};

export { getDailyDraw };
export type { DailyDraw };
