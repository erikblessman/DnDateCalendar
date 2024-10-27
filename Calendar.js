class Month {
  constructor(fullName, shortName, days) {
    this.#fullName = fullName;
    this.#shortName = shortName;
    this.#days = days;
  }

  #fullName;
  get fullName() { return this.#fullName; }

  #shortName;
  get shortName() { return this.#shortName; }

  #days;
  get days() { return this.#days; }
}

class DnDate {
  constructor(year, dayOfYear) {
    this.year = year;
    this.dayOfYear = dayOfYear;
  }

  year;
  dayOfYear;
}

class Calendar {
  // #region static
  static getDefaultParms() {
    return {
      schemaVersion: 0,
      months: [
        new Month('January', 'Jan', '01', 31),
        new Month('February', 'Feb', '02', 28),
        new Month('March', 'Mar', '03', 31),
        new Month('April', 'Apr', '04', 30),
        new Month('May', 'May', '05', 31),
        new Month('June', 'Jun', '06', 30),
        new Month('July', 'Jul', '07', 31),
        new Month('August', 'Aug', '08', 31),
        new Month('September', 'Sep', '09', 30),
        new Month('October', 'Oct', '10', 31),
        new Month('November', 'Nov', '11', 30),
        new Month('December', 'Dec', '12', 31),
      ],
      date: new DnDate(1, 1),
      format: 'YYYY-MM-DD',
      alarms: [],
    };
  };
  // #endregion static

  // #region constructor
  /***
   * @param {object} parms - Valid properties are:
   * - schemaVersion: number (default 0)
   * - months: array of Month objects (default January - December)
   * - date: DnDate object (default year: 1, dayOfYear: 1)
   * - format: string (default 'YYYY-MM-DD')
   * - alarms: array of Alarm objects (default [])
   * @returns {Calendar}
   */
  constructor(parms) {
    parms = { ...Calendar.getDefaultParms(), ...parms };
    this.#schemaVersion = parms.schemaVersion;
    this.#date = parms.date;
    this.#format = parms.format;

    // freeze the months array and each month object
    this.#months = parms.months;
    this.#months.forEach(month => Object.freeze(month));
    Object.freeze(this.#months);
    this.#daysInYear = this.#months.reduce((acc, month) => acc + month.days, 0);
  }
  // #endregion constructor

  // #region properties/getters
  #schemaVersion;
  get schemaVersion() { return this.#schemaVersion; }

  #months;
  get months() { return this.#months; }

  #date;
  get date() { return this.#date; }

  #format;
  get format() { return this.#format; }

  #alarms;
  get alarms() { return this.#alarms; }

  #daysInYear;
  get daysInYear() { return this.#daysInYear; }

  get month() {
    if (this.#date.dayOfYear < 1 || this.#date.dayOfYear > this.#daysInYear) {
      return null;
    }
    let days = 0;
    for (let i = 0; i < this.#months.length; i++) {
      const month = this.#months[i];
      days += month.days;
      if (this.#date.dayOfYear <= days) {
        return month;
      }
    }
    return null;
  }

  get dateStr() {
    return null;
  }
  // #endregion properties/getters

  // #region mutators
  /***
   * Adds (or subtracts) the specified number of days to the current date.
   * @param {number} days - The number of days to add (or subtract) to the current date. (Use negative numbers to subtract days.)
   */
  addDays(days) {
    if (days > 0) {
      let daysFromBeginningOfCurrentYear = this.#date.dayOfYear + days;
      const yearsToAdd = Math.floor(daysFromBeginningOfCurrentYear / this.#daysInYear);
      this.#date.year += yearsToAdd;
      this.#date.dayOfYear = daysFromBeginningOfCurrentYear % this.#daysInYear;
    } else if (days < 0) {
      let daysFromBeginningOfCurrentYear = this.#date.dayOfYear + days;
      if (daysFromBeginningOfCurrentYear < 1) {
        const yearsToSubtract = Math.floor(Math.abs(daysFromBeginningOfCurrentYear) / this.#daysInYear) + 1;
        this.#date.year -= yearsToSubtract;
        daysFromBeginningOfCurrentYear = this.#daysInYear - (Math.abs(daysFromBeginningOfCurrentYear) % this.#daysInYear);
      }
      this.#date.dayOfYear = daysFromBeginningOfCurrentYear;
    }
  }

  /***
   * Sets the current date to the specified date.
   * @param {DnDate|string} date - The date to set.
   */
  setDate(date) {
    let newDate;
    if (date instanceof DnDate) {
      if (date.dayOfYear < 1 || date.dayOfYear > this.#daysInYear) {
        throw new Error(`Invalid day of year (${date.dayOfYear})`);
      }
      newDate = new DnDate(date.year, date.dayOfYear);
    } else if (typeof date === 'string') {
      newDate = this.parseDateStr(date);
    } else {
      throw new Error('date must be a DnDate object or a string');
    }
    this.#date = newDate;
  }
  // #endregion mutators

  // #region utility methods
  /***
   * Parses a date string into a DnDate object.
   * @param {string} str - The date string to parse.  Valid formats are: YYYY-DOY, YYYY-MM-DD, or YYYY-Mmm-DD
   * @returns {DnDate} - The parsed date object.
   */
  parseDateStr(str) {
    if (!str) {
      throw new Error('no date string provided');
    }
    if (typeof str !== 'string') {
      throw new Error('date string must be a string');
    }

    // Parsing format YYYY-DOY
    if (str.match(/^\d+-\d+$/)) {
      const [year, dayOfYear] = str.split('-');
      const y = parseInt(year);
      const d = parseInt(dayOfYear);
      if (d < 1 || d > this.#daysInYear) {
        throw new Error(`Invalid day of year (${dayOfYear})`);
      }
      return new DnDate(y, d);
    }

    // Parsing format YYYY-MM-DD
    if (str.match(/^\d+-\d+-\d+$/)) {
      return this.dateFromParts(...str.split('-'));
    }

    // Parsing format YYYY-Mmm-DD
    if (str.match(/^\d+-.+-\d+$/)) {
      const [year, month, day] = str.split('-');
      let mIndex = this.#months.findIndex(m => m.fullName.toLowerCase() === month.toLowerCase());
      if (mIndex === -1) {
        mIndex = this.#months.findIndex(m => m.shortName.toLowerCase() === month.toLowerCase());
      }
      if (mIndex === -1) {
        throw new Error(`Invalid month (${month})`);
      }
      const monthObj = this.#months[mIndex];
      const y = parseInt(year);
      const m = mIndex + 1;
      const d = parseInt(day);
      if (d < 1 || d > monthObj.days) {
        throw new Error(`Invalid day (${day})`);
      }
      return this.dateFromParts(y, m, d);
    }

    throw new Error(`Invalid date string (${str}).  Use one of the following formats: YYYY-DOY, YYYY-MM-DD, or YYYY-Mmm-DD`);
  }

  /***
   * Creates a DnDate object from the specified year, month, and day.
   * @param {number} year - The year of the date.
   * @param {number} month - The month of the date.
   * @param {number} day - The day of the date.
   * @returns {DnDate} - The date object.
   */
  dateFromParts(year, month, day) {
    const y = parseInt(year);
    if (isNaN(y)) {
      throw new Error(`Invalid year (${year})`);
    }
    const m = parseInt(month);
    if (isNaN(m) || m < 1 || m > this.#months.length) {
      throw new Error(`Invalid month (${month})`);
    }
    const mObj = this.#months[m - 1];
    const d = parseInt(day);
    if (isNaN(d) || d < 1 || d > mObj.days) {
      throw new Error(`Invalid day (${day})`);
    }
    return new DnDate(y, this.#months.slice(0, m - 1).reduce((acc, month) => acc + month.days, 0) + d);
  }
  // #endregion utility methods
}

module.exports = { DnDate, Month, Calendar };