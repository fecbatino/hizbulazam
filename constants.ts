
import { DayOfWeek } from './types';

export const DAYS_ORDER: DayOfWeek[] = ['friday', 'saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];

// Mapping JS Date.getDay() (Sun=0, Mon=1...) to our week order (Fri=0, Sat=1...)
// We start the week on Friday as per the Hizb data.
export const DATE_DAY_TO_ORDER_INDEX: { [key: number]: number } = {
  0: 2, // Sunday
  1: 3, // Monday
  2: 4, // Tuesday
  3: 5, // Wednesday
  4: 6, // Thursday
  5: 0, // Friday
  6: 1, // Saturday
};
