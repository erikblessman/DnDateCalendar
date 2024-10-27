const { DnDate, Month, Calendar } = require('./Calendar');

describe('Calendar.constructor', () => {
  it('should set schemaVersion from parms', () => {
    const parms = { schemaVersion: 17 };
    const calendar = new Calendar(parms);
    expect(calendar.schemaVersion).toBe(17);
  });

  it('should set schemaVersion with default value', () => {
    jest.spyOn(Calendar, 'getDefaultParms').mockReturnValue({ schemaVersion: 63, months: [], date: new DnDate(321, 15) });
    const calendar = new Calendar();
    expect(calendar.schemaVersion).toBeDefined();
    expect(typeof calendar.schemaVersion).toBe('number');
    expect(calendar.schemaVersion).toBe(63);
  });

  it('should set months from parms', () => {
    const months = [new Month('Month One', 'One', '01', 11), new Month('Month Two', 'Two', '02', 22), new Month('Month Three', 'Three', '03', 33)];
    const calendar = new Calendar({ months });
    expect(calendar.months).toBe(months);
    expect(calendar.months.length).toBe(3);
    const m1 = calendar.months[0];
    expect(m1.fullName).toBe('Month One');
    expect(m1.shortName).toBe('One');
    expect(m1.numericName).toBe('01');
    expect(m1.days).toBe(11);
  });

  it('should set months with default value', () => {
    jest.spyOn(Calendar, 'getDefaultParms').mockReturnValue({ schemaVersion: 0, months: [new Month('Month 1', 'M1', '001', 100)], date: new DnDate(1, 1) });
    const calendar = new Calendar();
    expect(calendar.months).toBeDefined();
    expect(Array.isArray(calendar.months)).toBe(true);
    expect(calendar.months.length > 0).toBe(true);
    const m1 = calendar.months[0];
    expect(m1).toBeInstanceOf(Month);
    expect(m1.fullName).toBe('Month 1');
    expect(m1.shortName).toBe('M1');
    expect(m1.numericName).toBe('001');
    expect(m1.days).toBe(100);
  });

  it('should set date from parms', () => {
    const date = new DnDate(12, 43);
    const calendar = new Calendar({ date });
    expect(calendar.date).toBe(date);
    expect(calendar.date).toBeInstanceOf(DnDate);
    expect(calendar.date.year).toBe(12);
    expect(calendar.date.dayOfYear).toBe(43);
  });

  it('should set date with default value', () => {
    jest.spyOn(Calendar, 'getDefaultParms').mockReturnValue({ schemaVersion: 0, months: [], date: new DnDate(321, 15) });
    const calendar = new Calendar();
    expect(calendar.date).toBeDefined();
    expect(calendar.date).toBeInstanceOf(DnDate);
    expect(calendar.date.year).toBe(321);
    expect(calendar.date.dayOfYear).toBe(15);
  });

  it('should set format from parms', () => {
    const calendar = new Calendar({ format: 'boofar' });
    expect(calendar.format).toBe('boofar');
  });

  it('should set format with default value', () => {
    jest.spyOn(Calendar, 'getDefaultParms').mockReturnValue({ schemaVersion: 0, months: [], date: new DnDate(321, 15), format: 'six fingered man' });
    const calendar = new Calendar();
    expect(calendar.format).toBeDefined();
    expect(typeof calendar.format).toBe('string');
    expect(calendar.format).toBe('six fingered man');
  });
});

describe('Calendar.getDefaultParms', () => {
  it('should return an object with all required properties', () => {
    const parms = Calendar.getDefaultParms();
    expect(parms).toBeDefined();
    expect(parms.schemaVersion).toBeDefined();
    expect(parms.months).toBeDefined();
    expect(Array.isArray(parms.months)).toBe(true);
    expect(parms.months.length > 0).toBe(true);
    expect(parms.date).toBeDefined();
    expect(parms.date).toBeInstanceOf(DnDate);
    expect(parms.format).toBeDefined();
    expect(typeof parms.format).toBe('string');
    expect(parms.alarms).toBeDefined();
    expect(Array.isArray(parms.alarms)).toBe(true);
  });
});

describe('Calendar.daysInYear', () => {
  it('should return the number of days in a year', () => {
    const calendar = new Calendar({
      months: [
        new Month('Month 1', 'M1', '001', 100),
        new Month('Month 2', 'M2', '002', 20),
        new Month('Month 3', 'M3', '003', 3)]
    });
    expect(calendar.daysInYear).toBe(123);
  })
});

describe('Calendar.addDays', () => {
  const calendar = new Calendar({
    months: [
      new Month('Month 1', 'M1', '001', 100),
      new Month('Month 2', 'M2', '002', 20),
      new Month('Month 3', 'M3', '003', 3)]
  });
  test.each([
    // description, days, year, dayOfYear, expectedYear, expectedDayOfYear
    ['add 1 day to a nominal date', 1, 17, 12, 17, 13],
    ['subtract 1 day from a nominal date', -1, 17, 12, 17, 11],
    ['handle crossing the last day of the year by 1', 1, 1999, 123, 2000, 1],
    ['handle crossing the first day of the year by -1', -1, 2000, 1, 1999, 123],
  ])('should %s', (description, days, year, dayOfYear, expectedYear, expectedDayOfYear) => {
    calendar.date.year = year;
    calendar.date.dayOfYear = dayOfYear;
    calendar.addDays(days);
    expect(calendar.date.year).toBe(expectedYear);
    expect(calendar.date.dayOfYear).toBe(expectedDayOfYear);
  });
});

describe('Calendar.parseDateStr', () => {
  const calendar = new Calendar({
    months: [
      new Month('Month 1', 'M1', '001', 11),
      new Month('Month 2', 'M2', '002', 22),
      new Month('Month 3', 'M3', '003', 33)]
  });
  // test valid strings
  test.each([
    // date string, year, dayOfYear
    ['523-01', 523, 1],
    ['523-66', 523, 66],
    ['243-01-01', 243, 1],
    ['7654-02-20', 7654, 31],
    ['123-M2-04', 123, 15],
    ['353-Month 3-33', 353, 66],
  ])('should parse a valid date string (%s)', (str, year, dayOfYear) => {
    const date = calendar.parseDateStr(str);
    expect(date).toBeDefined();
    expect(date).toBeInstanceOf(DnDate);
    expect(date.year).toBe(year);
    expect(date.dayOfYear).toBe(dayOfYear);
  });
  // test invalid strings
  test.each([
    ['243-01-01-01'], // Bad format
    ['bob'], // Bad format
    [undefined], // Bad format
    [null], // Bad format
    [44], // Bad format
    [{}], // Bad format
    [[]], // Bad format
    ['534-00'], // Day < 1
    ['534-67'], // Too many days in year
    ['534-999'], // Too many days in year
    ['123-M2-0'], // Day < 1
    ['123-M2-23'], // Too many days for month
    ['123-M2-623'], // Too many days for month
  ])(`should throw an error for an invalid date string (%s)`, (str) => {
    expect(() => calendar.parseDateStr(str)).toThrow();
  });
});

describe('Calendar.dateFromParts', () => {
  const calendar = new Calendar({
    months: [
      new Month('Month 1', 'M1', '001', 11),
      new Month('Month 2', 'M2', '002', 22),
      new Month('Month 3', 'M3', '003', 33)]
  });
  // test valid parts
  test.each([
    // year, month, day, expectedDayOfYear
    [243, 1, 1, 1],
    [243, 1, 11, 11],
    [7654, 2, 20, 31],
    [123, 3, 1, 34],
    [123, 3, 33, 66],
  ])('should create a date from valid parts (%i, %i, %i)', (year, month, day, expectedDayOfYear) => {
    const date = calendar.dateFromParts(year, month, day);
    expect(date).toBeDefined();
    expect(date).toBeInstanceOf(DnDate);
    expect(date.year).toBe(year);
    expect(date.dayOfYear).toBe(expectedDayOfYear);
  });
  // test invalid parts
  test.each([
    // year, month, day, error text
    ['bob', 1, 1, 'Invalid year (bob)'],
    [243, 'bob', 1, 'Invalid month (bob)'],
    [243, 1, 'bob', 'Invalid day (bob)'],
    [243, 1, 0, 'Invalid day (0)'],
    [243, 1, -99, 'Invalid day (-99)'],
    [243, 1, 12, 'Invalid day (12)'],
    [243, 1, 35, 'Invalid day (35)'],
    [243, 0, 1, 'Invalid month (0)'],
    [243, -34734, 1, 'Invalid month (-34734)'],
    [243, 4, 1, 'Invalid month (4)'],
    [243, 3468, 1, 'Invalid month (3468)'],
  ])(`should throw an error for invalid parts (%i, %i, %i)`, (year, month, day, errorText) => {
    expect(() => calendar.dateFromParts(year, month, day)).toThrow(errorText);
  });
});