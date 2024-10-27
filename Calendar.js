class Month {
  constructor(fullName, shortName, numericName, days) {
    this.#fullName = fullName;
    this.#shortName = shortName;
    this.#numericName = numericName;
    this.#days = days;
  }

  #fullName;
  get fullName() { return this.#fullName; }

  #shortName;
  get shortName() { return this.#shortName; }

  #numericName;
  get numericName() { return this.#numericName; }

  #days;
  get days() { return this.#days; }
}

class DnDate {
  constructor(_year, _dayOfYear) {
    this.#year = _year;
    this.#dayOfYear = _dayOfYear;
  }

  #year;
  get year() { return this.#year; }

  #dayOfYear;
  get dayOfYear() { return this.#dayOfYear; }
}

class Calendar {
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
  constructor(parms) {
    parms = { ...Calendar.getDefaultParms(), ...parms };
    this.#schemaVersion = parms.schemaVersion;
    this.#months = parms.months;
    this.#date = parms.date;
    this.#format = parms.format;
  }

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
}

module.exports = { DnDate, Month, Calendar };