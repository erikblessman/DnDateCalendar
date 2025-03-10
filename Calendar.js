// BEGIN COPY - Copy everything below this line and above the "// END COPY" line below and paste it into the "Schema" region of DnDateCalendar.js
class Month {
  constructor(fullName, shortName, days) {
    this.fullName = fullName;
    this.shortName = shortName;
    this.days = Number(days);
  }

  fullName;
  shortName;
  days;
}

class DnDate {
  constructor(year, dayOfYear) {
    this.year = year;
    this.dayOfYear = dayOfYear;
  }

  year;
  dayOfYear;
}

class Alarm {
  constructor(name, date, message) {
    this.name = name;
    this.date = date;
    this.message = message;
  }
}

class Calendar {
  // TODO: Consider a callback method for when properties of the calendar change to allow for triggering messages
  // #region static
  static getDefaultParms() {
    return {
      schemaVersion: 0,
      months: [
        new Month('January', 'Jan', 31),
        new Month('February', 'Feb', 28),
        new Month('March', 'Mar', 31),
        new Month('April', 'Apr', 30),
        new Month('May', 'May', 31),
        new Month('June', 'Jun', 30),
        new Month('July', 'Jul', 31),
        new Month('August', 'Aug', 31),
        new Month('September', 'Sep', 30),
        new Month('October', 'Oct', 31),
        new Month('November', 'Nov', 30),
        new Month('December', 'Dec', 31),
      ],
      date: new DnDate(1, 1),
      format: 'YYYY-Mon-DD',
      alarms: [],
    };
  };
  // #endregion static

  // #region construction
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
    this.#schemaVersion = Number(parms.schemaVersion);
    this.#date = parms.date;
    this.#format = parms.format;
    this.#alarms = parms.alarms;

    // freeze the months array and each month object
    this.#months = parms.months;
    this.#months.forEach(month => Object.freeze(month));
    Object.freeze(this.#months);

    // Calculate the days in the year based on the months
    this.#daysInYear = this.#months.reduce((acc, month) => acc + month.days, 0);
  }
  // #endregion constructor

  toObj() {
    return {
      schemaVersion: this.schemaVersion,
      date: this.date,
      format: this.format,
      alarms: this.alarms,
      months: this.months,
    };
  }

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

  /**
   * Formats the current date as a string.
   * @param {string} format The format you want the date in (default: this.format)
   *  Use the following placeholders: DOY, YYYY, MM, DD, Month, Mon.
   * For YYYY and DD, you can increase the number of characters to pad with zeros.
   * DOY is the day of the year (1-number of days in the year).
   * YYYY is the year.
   * MM is the month number (1-12).
   * DD is the day of the month.
   * Month is the full month name.
   * Mon is the short month name.
   * Aside from these placeholders, the format string can contain any other characters.
   * @returns 
   */
  getDateStr(date = this.#date) {
    const format = this.#format;
    // year replacements
    let str = format.replaceAll('DOY', this.#date.dayOfYear.toString());
    str = str.replaceAll(/Y+/g, str => this.#date.year.toString().padStart(str.length, '0'));

    // day replacements
    const parts = this.getDateParts(date);
    if (!parts) {
      throw new Error("Unable to get parts from date: " + JSON.stringify(date));
    }
    str = str.replaceAll(/D+/g, str => parts.dayOfMonth.toString().padStart(str.length, '0'));

    // month replacements
    const longNamePH = '^^^^';
    const shortNamePH = ';;;;';
    str = str.replaceAll('Month', longNamePH);
    str = str.replaceAll('Mon', shortNamePH);
    const monthNum = parseInt(parts.monthIndex) + 1;
    str = str.replaceAll(/M+/g, str => monthNum.toString().padStart(str.length, '0'));
    str = str.replaceAll(longNamePH, parts.month.fullName);
    str = str.replaceAll(shortNamePH, parts.month.shortName);
    return str;
  }
  // #endregion properties/getters

  // #region mutators
  /***
   * Adds (or subtracts) the specified number of days to the current date.
   * @param {number} days - The number of days to add (or subtract) to the current date. (Use negative numbers to subtract days.)
   */
  addDays(days) {
    // TODO: Handle setting off alarms
    // - Find alarms where prevDate < alarm.date <= newDate
    //   - Show Alarm Message to GM (Need a callback method for handling this)
    days = Number(days);
    if (days > 0) {
      let daysFromBeginningOfCurrentYear = Number(this.#date.dayOfYear) + days;
      const yearsToAdd = Math.floor(daysFromBeginningOfCurrentYear / this.#daysInYear);
      this.#date.year += yearsToAdd;
      this.#date.dayOfYear = daysFromBeginningOfCurrentYear % this.#daysInYear;
    } else if (days < 0) {
      let daysFromBeginningOfCurrentYear = Number(this.#date.dayOfYear) + days;
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

  addAlarm(alarm) {
    if (this.#alarms.find(a => a.name === alarm.name)) {
      throw new Error(`Alarm with name ${alarm.name} already exists`);
    }
    this.#alarms.push(alarm);
  }

  editAlarm(name, newAlarm) {
    const alarmIndex = this.#alarms.findIndex(a => a.name === name);
    if (alarmIndex === -1) {
      throw new Error(`Alarm with name ${name} not found`);
    }
    this.#alarms[alarmIndex] = newAlarm;
  }

  removeAlarm(name) {
    const alarmIndex = this.#alarms.findIndex(a => a.name === name);
    if (alarmIndex === -1) {
      throw new Error(`Alarm with name ${name} not found`);
    }
    this.#alarms.splice(alarmIndex, 1);
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

  /***
   * Returns the month, monthIndex, and day of month for the current date.
   */
  getDateParts(date = this.#date) {
    let days = date.dayOfYear;
    for (let i = 0; i < this.#months.length; i++) {
      const month = this.#months[i];
      if (days <= month.days) {
        return { month: month, monthIndex: i, dayOfMonth: days };
      }
      days -= month.days;
    }
  }
  // #endregion utility methods
}

// END COPY - Do not include the code below in DnDateCalendar.js

module.exports = { Alarm, DnDate, Month, Calendar };