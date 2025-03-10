const { Alarm, DnDate, Month, Calendar } = require('./Calendar');

describe('Calendar.constructor', () => {
  it('should set properties from parms', () => {
    const parms = {
      schemaVersion: 17,
      months: [new Month('Month 1', 'M1', 11)],
      date: new DnDate(1, 1),
      format: 'YYYY-MM-DD',
      alarms: [new Alarm('Alarm 1', 'A1', 1),]
    };
    const calendar = new Calendar(parms);
    expect(calendar.schemaVersion).toBe(17);
    expect(calendar.months).toBe(parms.months);
    expect(calendar.date).toBe(parms.date);
    expect(calendar.format).toBe(parms.format);
    expect(calendar.alarms).toBe(parms.alarms);
  });
  it('should set properties from string parms', () => {
    const parms = {
      schemaVersion: '17',
      months: [new Month('Month 1', 'M1', '11'), new Month('Month 2', 'M2', '22')],
      date: new DnDate('1', '1'),
      format: 'YYYY-MM-DD',
      alarms: [new Alarm('Alarm 1', 'A1', '1'),]
    };
    const calendar = new Calendar(parms);
    expect(calendar.schemaVersion).toBe(17);
    expect(calendar.months).toBe(parms.months);
    expect(calendar.date).toBe(parms.date);
    expect(calendar.format).toBe(parms.format);
    expect(calendar.alarms).toBe(parms.alarms);
    expect(calendar.daysInYear).toBe(33);
  });
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
    const months = [
      new Month('Month One', 'One', 11),
      new Month('Month Two', 'Two', 22),
      new Month('Month Three', 'Three', 33)];
    const calendar = new Calendar({ months });
    expect(calendar.months).toBe(months);
    expect(calendar.months.length).toBe(3);
    const m1 = calendar.months[0];
    expect(m1.fullName).toBe('Month One');
    expect(m1.shortName).toBe('One');
    expect(m1.days).toBe(11);
  });

  it('should set months with default value', () => {
    jest.spyOn(Calendar, 'getDefaultParms').mockReturnValue({
      schemaVersion: 0, months: [
        new Month('Month 1', 'M1', 100)], date: new DnDate(1, 1)
    });
    const calendar = new Calendar();
    expect(calendar.months).toBeDefined();
    expect(Array.isArray(calendar.months)).toBe(true);
    expect(calendar.months.length > 0).toBe(true);
    const m1 = calendar.months[0];
    expect(m1).toBeInstanceOf(Month);
    expect(m1.fullName).toBe('Month 1');
    expect(m1.shortName).toBe('M1');
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

  it('should set months with default value', () => {
    const calendar = new Calendar();
    expect(calendar.months).toBeDefined();
    expect(Array.isArray(calendar.months)).toBe(true);
    expect(calendar.months.length > 0).toBe(true);
    expect(calendar.months[0].fullName).toBe('January');
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
    expect(parms.months[0].fullName).toBe('January');
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
        new Month('Month 1', 'M1', 100),
        new Month('Month 2', 'M2', 20),
        new Month('Month 3', 'M3', 3)]
    });
    expect(calendar.daysInYear).toBe(123);
  })
});

describe('Calendar.addDays', () => {
  const calendar = new Calendar({
    months: [
      new Month('Month 1', 'M1', 100),
      new Month('Month 2', 'M2', 20),
      new Month('Month 3', 'M3', 3)]
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

describe('Calendar.setDate', () => {
  const calendar = new Calendar({
    months: [
      new Month('Month 1', 'M1', 100),
      new Month('Month 2', 'M2', 20),
      new Month('Month 3', 'M3', 3)]
  });
  // Test with valid DnDate objects
  test.each([
    // year, dayOfYear
    [1, 1],
    [17, 12],
    [1999, 123],
    [2000, 1],
  ])('should set the date to a valid DnDate object (%i, %i)', (year, dayOfYear) => {
    const date = new DnDate(year, dayOfYear);
    calendar.setDate(date);
    expect(calendar.date).not.toBe(date);
    expect(calendar.date.year).toBe(year);
    expect(calendar.date.dayOfYear).toBe(dayOfYear);
  });
  // Test with INVALID DnDate objects (for this calendar)
  test.each([
    // year, dayOfYear
    [1, 0], // day < 1
    [17, -13], // day < 1
    [1999, 124], // day > days in year
    [2000, 444], // day > days in year
  ])('should throw error for invalid date (%i, %i)', (year, dayOfYear) => {
    const date = new DnDate(year, dayOfYear);
    expect(() => calendar.setDate(date)).toThrow();
  });
  // Test with valid strings
  test.each([
    // year, dayOfYear
    ['523-01', 523, 1],
    ['523-66', 523, 66],
    ['243-01-01', 243, 1],
    ['7654-02-20', 7654, 120],
    ['123-M2-04', 123, 104],
    ['353-Month 3-3', 353, 123],
  ])('should set the date from a valid string (%s)', (str, year, dayOfYear) => {
    calendar.setDate(str);
    expect(calendar.date).toBeDefined();
    expect(calendar.date).toBeInstanceOf(DnDate);
    expect(calendar.date.year).toBe(year);
    expect(calendar.date.dayOfYear).toBe(dayOfYear);
  });
  // Test with INVALID strings (for this calendar)
  test.each([
    // string
    ['243-01-01-01'], // Bad format
    ['bob'], // Bad format
    [undefined], // Bad format
    [null], // Bad format
    [44], // Bad format
    [{}], // Bad format
    [[]], // Bad format
    ['534-00'], // Day < 1
    ['534-124'], // Too many days in year
    ['534-999'], // Too many days in year
    ['123-M2-0'], // Day < 1
    ['123-M2-23'], // Too many days for month
    ['123-M2-623'], // Too many days for month
  ])('should throw error for invalid string (%s))', (str) => {
    expect(() => calendar.setDate(str)).toThrow();
  });
});

describe('Calendar.getDateStr', () => {
  const parms = {
    months: [
      new Month('Monotember', 'Mon', 11),
      new Month('Duotember', 'Duo', 22),
      new Month('Tritember', 'Tri', 33)
    ],
    date: new DnDate(1, 1),
  };
  test.each([
    // Expected Output, Date, Format
    ['1123-Monotember-01', 'YYYY-Month-DD', new DnDate(1123, 1)],
    ['5813-Duo-02', 'YYYY-Mon-DD', new DnDate(5813, 13)],
    ['2134-03-17', 'YYYY-MM-DD', new DnDate(2134, 50)],
  ])('should generate expected date string (%s) for format (%s) with given date', (str, format, date) => {
    const calendar = new Calendar({ ...parms, date: date, format: format });
    expect(calendar.getDateStr(date)).toBe(str);
  });
});

describe('Calendar.getDateStr', () => {
  const parms = {
    months: [
      new Month('Monotember', 'Mon', 11),
      new Month('Duotember', 'Duo', 22),
      new Month('Tritember', 'Tri', 33)
    ],
    date: new DnDate(1234, 1),
  };
  test.each([
    // Expected Output, Date, Format
    ['1234-Monotember-01', 'YYYY-Month-DD', null],
    ['1234-Mon-01', 'YYYY-Mon-DD', null],
    ['1234-01-01', 'YYYY-MM-DD', null],
  ])('should generate expected date string (%s) for format (%s) with null date', (str, format, date) => {
    const calendar = new Calendar({ ...parms, format: format });
    console.log(JSON.stringify(calendar.toObj()));
    expect(calendar.getDateStr()).toBe(str);
  });
});

describe('Calendar.parseDateStr', () => {
  const calendar = new Calendar({
    months: [
      new Month('Month 1', 'M1', 11),
      new Month('Month 2', 'M2', 22),
      new Month('Month 3', 'M3', 33)]
  });
  // Test valid strings
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
  // Test invalid strings
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
      new Month('Month 1', 'M1', 11),
      new Month('Month 2', 'M2', 22),
      new Month('Month 3', 'M3', 33)]
  });
  // Test valid parts
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
  // Test invalid parts
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

describe('Calendar.month', () => {
  const months = [
    new Month('Month 1', 'M1', 11),
    new Month('Month 2', 'M2', 22),
    new Month('Month 3', 'M3', 33)];
  // Test valid day of year
  test.each([
    // dayOfYear, expectedMonth
    [1, months[0]],
    [11, months[0]],
    [12, months[1]],
    [33, months[1]],
    [34, months[2]],
    [66, months[2]],
  ])(`should return the correct month for day of year (%i)`, (dayOfYear, expectedMonth) => {
    const calendar = new Calendar({ months, date: new DnDate(1, dayOfYear) });
    expect(calendar.month).toBe(expectedMonth);
  });
  // Test invalid day of year
  test.each([-5, 0, 67, 100, 999])('should throw an error for invalid day of year (%i)', (dayOfYear) => {
    const calendar = new Calendar({ months, date: new DnDate(1, dayOfYear) });
    expect(calendar.month).toBe(null);
  });
});

describe('Calendar.getDateParts', () => {
  const m1 = new Month('Month 1', 'M1', 11);
  const m2 = new Month('Month 2', 'M2', 22);
  const m3 = new Month('Month 3', 'M3', 33);
  const months = [m1, m2, m3];
  const calendar = new Calendar({ months });
  test.each([
    // year, dayOfYear, expectedParts
    [1, 0, 1],
    [11, 0, 11],
    [31, 1, 20],
    [34, 2, 1],
    [66, 2, 33],
  ])('should return the correct parts for a valid date (%i, %i)', (dayOfYear, monthIndex, dayOfMonth) => {
    const date = new DnDate(1, dayOfYear);
    calendar.setDate(date);
    const parts = calendar.getDateParts();
    expect(parts.monthIndex).toEqual(monthIndex);
    expect(parts.month).toEqual(months[monthIndex]);
    expect(parts.dayOfMonth).toEqual(dayOfMonth);
  });
});

describe('Calendar.addAlarm', () => {
  const calendar = new Calendar();
  const alarm = new Alarm('Alarm 1', new DnDate(2000, 22), 'hello world');
  it('should add an alarm to the calendar', () => {
    calendar.addAlarm(alarm);
    expect(calendar.alarms).toContain(alarm);
  });
  it('should throw an error if the alarm has a duplicate name', () => {
    const duplicateAlarm = new Alarm('Alarm 1', new DnDate(444, 44), 'goodbye world');
    expect(() => calendar.addAlarm(duplicateAlarm)).toThrow();
  });
});

describe('Calendar.editAlarm', () => {
  let calendar, oldAlarm;
  beforeEach(() => {
    oldAlarm = new Alarm('caterpillar', new DnDate(2000, 22), 'hello world');
    calendar = new Calendar({ alarms: [oldAlarm] });
  });

  it('should edit an existing alarm', () => {
    const newAlarm = new Alarm('butterfly', new DnDate(444, 44), 'goodbye world');
    calendar.editAlarm(oldAlarm.name, newAlarm);
    const alarm = calendar.alarms[0];
    expect(alarm.name).toBe('butterfly');
    expect(alarm.date).toBe(newAlarm.date);
    expect(alarm.message).toBe(newAlarm.message);
  });

  it('should throw an error if the alarm does not exist', () => {
    const newAlarm = new Alarm('butterfly', new DnDate(444, 44), 'goodbye world');
    expect(() => calendar.editAlarm('nonexistent', newAlarm)).toThrow();
  });
});

describe('Calendar.removeAlarm', () => {
  let calendar, alarm1, alarm2;
  beforeEach(() => {
    alarm1 = new Alarm('caterpillar', new DnDate(2000, 22), 'goodbye old world');
    alarm2 = new Alarm('butterfly', new DnDate(2000, 44), 'hello new world');
    calendar = new Calendar({ alarms: [alarm1, alarm2] });
  });

  it('should remove an existing alarm', () => {
    expect(calendar.alarms.length).toBe(2);
    calendar.removeAlarm(alarm1.name);
    expect(calendar.alarms.length).toBe(1);
    expect(calendar.alarms.findIndex(a => a.name === alarm1.name)).toBe(-1);
  });

  it('should throw an error when the named alarm does not exist', () => {
    expect(() => calendar.removeAlarm('ASDFASFDASFDASFDASFD')).toThrow();
  })
});