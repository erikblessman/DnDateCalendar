const DnDateCalendar = (() => {

  const scriptName = 'DnDateCalendar';
  const version = '0.1.0';
  const schemaVersion = 1;
  //TODO: suggestion use javascript get/set keywords for the calendar
  let calendar = null;
  //TODO: suggestion: store logLevel in state and provide setters/getters
  let LOG_LEVEL = 'TRACE';

  // #region STATE FUNCTIONS
  const initState = function () {
    try {
      let calendarObj = state[scriptName];
      if (!calendarObj) {
        calendar = new Calendar();
      } else if (calendar.schemaVersion != schemaVersion) {
        updateCalendar(calendarObj);
      } else {
        calendar = new Calendar(calendarObj);
      }
      updateState();
    } catch (e) {
      showException(e, 'Error initializing state');
    }
  }

  const updateState = function () {
    state[scriptName] = calendar.toObj();
  }

  const updateCalendar = function ($oldCalendar) {
    const msg = `Updating calendar from schema version ${$oldCalendar.schemaVersion} to ${schemaVersion}`;
    whisper('gm', header('Updating Calendar Schema') + list([
      `Old Version: ${$oldCalendar.schemaVersion}`,
      `New Version: ${schemaVersion}`]));
    log(`BEGINNING: ${msg}`);
    if ($oldCalendar.schemaVersion == 0.1) {
      const date = new DnDate($oldCalendar.year, $oldCalendar.dayOfYear);
      const months = $oldCalendar?.months.map((m, i) => new Month(m.name, m.name.substring(0, 3), (i + 1).toString().padStart(2, '0'), m.days)) ?? defaultMonths;
      const alarms = $oldCalendar?.alarms?.map(a => new Alarm(a.name, new DnDate(a.year, a.dayOfYear), a.message));
      const newCalendar = new Calendar({ schemaVersion, date, months, alarms });
      if (!newCalendar) {
        whisper('gm', 'Failed to update calendar');
        return;
      }
      calendar = new Calendar({ schemaVersion, date, months, alarms });
    } else {
      throw new Error(`Unknown schema version [${$oldCalendar.schemaVersion}]`);
    }
    whisper('gm', `COMPLETED: ${msg}`);
  }
  // #endregion STATE FUNCTIONS

  // #region MESSAGE ROUTING
  const isApiMsg = function ($msg) {
    if (!$msg) {
      return false;
    }
    if ($msg.type != "api") {
      return false;
    }
    if (!$msg.content) {
      return false;
    }
    if (!/^!dndate(\b\s|$)/.test($msg.content)) {
      return false;
    }
    return true;
  }

  const routeMessage = function ($msg) {
    trace('routeMessage', 1);
    if ($msg.content == '!dndate') {
      showCalendar();
      return;
    }
    const args = $msg.content.split(' ');
    args.shift(); // remove the !date arg
    const command = args.shift();
    switch (command) {
      case 'alarms':
        showAlarms();
        return;
      case 'alarm':
        const command2 = args.shift();
        switch (command2) {
          case 'add': calendar.addAlarm(args); break;
          case 'edit': calendar.editAlarm(args); break;
          case 'delete': calendar.deleteAlarm(args); break;
          case 'rename': calendar.renameAlarm(args); break;
          default: throw new Error(`Unknown alarm command [${command2}]`);
        }
        showAlarms();
        return;
      case 'next':
        calendar.addDays(1);
        break;
      case 'prev':
        calendar.addDays(-1);
        break;
      case 'add':
        calendar.addDays(args);
        break;
      case 'set':
        calendar.setDate(args);
        break;
      case 'reset':
        delete state[scriptName];
        initState();
        break;
      case 'help':
        const who = args.length > 0 ? args[0] : $msg.who;
        showHelp(who);
        return;
      case 'logState':
        log(JSON.stringify(state));
        return;
      case 'logLevel':
        LOG_LEVEL = args.shift();
        whisper('gm', `Log Level set to [${LOG_LEVEL}]`);
        return;
      case 'nuke':
        delete state[scriptName];
        whisper('gm', 'state nuked');
        return;
      default:
        throw new Error(`Unknown command [${$msg.content}]`);
    }
    showCalendar();
  };
  // #endregion MESSAGE ROUTING

  // #region SHOW/CHAT FUNCTIONS
  const debug = function ($msg) {
    ['TRACE', 'DEBUG'].includes(LOG_LEVEL) && whisper('gm', $msg);
  }
  const trace = function ($method, $num) {
    if (['TRACE'].includes(LOG_LEVEL)) {
      whisper('gm', `${$method}:${$num}`);
      log(`${$method}:${$num}`);
    }
  }
  const whisper = function ($who, $content) {
    const chatMessage = `/w ${$who} ${apiMessage($content)}`;
    sendChat(scriptName, chatMessage);
  }
  const showCalendar = function ($who = 'gm') {
    whisper($who, `${header(calendar.getDateStr())}`);
  }
  const showHelp = function ($who) {
    const commands = [
      ['!dndate', 'show the current date'],
      ['!dndate next', '*advance the date by one day'],
      ['!dndate prev', '*go back one day'],
      ['!dndate add DAYS', '*add the specified number of days to the date (e.g. !dndate add 5 OR !dndate add -45)'],
      ['!dndate set DATE', '*set the date to the specified date'],
      ['!dndate alarms', '*show this help message'],
      ['!dndate alarm add|edit NAME DATE MESSAGE', '*add or edit an alarm'],
      ['!dndate alarm rename OLDNAME NEWNAME', '*rename an alarm'],
      ['!dndate reset', '*reset the date to the default'],
      ['!dndate help [WHO]', 'show this help message (e.g. !dndate help William)'],
    ];
    whisper($who, header(`${scriptName} Help`) + table(commands));
    const notes = [
      '* Requires GM permissions',
      'ARGS in [BRACKETS] are optional',
      'Alternatives args are separated by | (as with !dndate alarm add|edit)',
      'DATE is in the format YYYY-MM-DD or YYYY DOY',
    ]
    whisper($who, header('Help Notes') + list(notes));
  }
  const showException = function ($e, $msg) {
    const errorStyle = `margin: .1em 1em 1em 1em; font-size: 1em; color: #333; text-align: center;`;
    const errorStr = `<div style="${errorStyle}">${$e?.message ?? 'Unknown Error'}</div>`;
    log(`>>>>>>>>>>>>>>>>> ${scriptName} Error <<<<<<<<<<<<<<<<<`);
    log('Message:');
    log(JSON.stringify($msg));
    log('Exception:');
    log(JSON.stringify($e));
    log("---------------- STATE ----------------");
    log(JSON.stringify(state));
    whisper('gm', header(`${scriptName} Error`) + errorStr);
  }
  const showAlarms = function () {
    const alarms = calendar.alarms;
    if (!alarms || alarms.length == 0) {
      whisper('gm', header('Alarms') + 'No alarms set');
      return;
    }
    const alarmRows = alarms.map(a => [a.name, calendar.dateStr(a.date), a.message]);
    alarmRows.unshift(['Name', 'Date', 'Message']);
    whisper('gm', header('Alarms') + table(alarmRows));
  }
  // #endregion CHAT FUNCTIONS

  // #region HTML BUILDING FUNCTIONS
  const apiMessage = function ($content) {
    const style = 'border:1px solid black; background-color: #fee; padding: .2em; border-radius:.4em; color: #333;';
    return `<div style="${style}">${$content}</div>`;
  }
  const header = function ($txt) {
    const style = 'font-size: 1.2em; font-weight: bold; text-align: center; color: #f66; padding: .2em 1em;';
    return `<div style="${style}">${$txt}</div>`;
  }
  const table = function ($rows) {
    return `<div style="display: table;">${$rows.map(r => row(r)).join('')}</div>`;
  }
  const row = function ($cells) {
    return `<div style="display: table-row;">${$cells.map((c, i) => i == 0 ? headerCell(c) : cell(c)).join('')
      }</div>`;
  }
  const headerCell = function ($content) {
    return cell($content, 'font-weight: bold; color: #000;');
  }
  const cell = function ($content, $style) {
    const baseStyle = 'display: table-cell; border: 1px solid #666; color: #333; padding: .2em .5em;';
    return `<div style="${baseStyle} ${$style}">${$content}</div>`;
  }
  const list = function ($items) {
    return `<ul>${$items.map(i => `<li>${i}</li>`).join('')}</ul>`;
  }
  // #endregion HTML BUILDING FUNCTIONS

  // #region EVENT HANDLERS
  const onChatMessage = function ($msg) {
    try {
      if (!isApiMsg($msg)) {
        return;
      }
      routeMessage($msg);
    } catch (e) {
      showException(e, $msg);
    }

  };

  const registerEventHandlers = function () {
    on('chat:message', onChatMessage);
  };

  on("ready", () => {
    registerEventHandlers();
    initState();
    log(`==> ${scriptName} v${version} Ready`);
  });
  // #endregion EVENT HANDLERS

  // #region Schema ------------------------------------------------------------------------------------------------
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

  class Alarm {
    constructor(name, date, message) {
      this.name = name;
      this.date = date;
      this.message = message;
    }
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
        format: 'YYYY-MMM-DD',
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
      this.#schemaVersion = parms.schemaVersion;
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
    getDateStr(format = this.#format) {
      // year replacements
      let str = format.replaceAll('DOY', this.#date.dayOfYear.toString());
      str = str.replaceAll(/Y+/g, str => this.#date.year.toString().padStart(str.length, '0'));

      // day replacements
      const parts = this.getDateParts();
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
    getDateParts() {
      let days = this.#date.dayOfYear;
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

  // #endregion Schema (Paste copied Calendar.js code in here) -----------------------------------------------------------

  // #region DEFAULTS
  // Default calendar is the Gregorian calendar, minus leapday/leapyear shenannigans (for simplicity)
  const defaultMonths = [
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
  ];
  // #endregion DEFAULTS
})();