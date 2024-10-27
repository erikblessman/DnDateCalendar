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