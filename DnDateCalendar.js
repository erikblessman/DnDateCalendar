const DnDateCalendar = (() => {

  const scriptName = 'DnDateCalendar';
  const version = '0.1.0';
  const schemaVersion = 1;
  //TODO: suggestion use javascript get/set keywords for the calendar
  let calendar = null;
  //TODO: suggestion: store logLevel in state and provede setters/getters
  let LOG_LEVEL = 'WARN';

  // #region STATE FUNCTIONS
  const initState = function () {
    try {
      calendar = state[scriptName];
      if (!calendar) {
        calendar = new Calendar(schemaVersion, defaultDate, defaultMonths, defaultAlarms);
        updateState();
      } else if (calendar.schemaVersion != schemaVersion) {
        updateCalendar(calendar) && updateState()
      } else {
        calendar = Calendar.fromState(calendar);
      }
    } catch (e) {
      showException(e, 'Error initializing state');
    }
  }

  const updateState = function () {
    state[scriptName] = calendar;
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
      const newCalendar = new Calendar(schemaVersion, date, months, alarms);
      if (!newCalendar) {
        whisper('gm', 'Failed to update calendar');
        return;
      }
      calendar = new Calendar(schemaVersion, date, months, alarms);
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
        calendar.addDay(1);
        break;
      case 'prev':
        calendar.addDay(-1);
        break;
      case 'add':
        calendar.addDay(args);
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
        log(JSON.stringify(state[scriptName]));
        return;
      case 'logLevel':
        LOG_LEVEL = args.shift();
        whisper('gm', `Log Level set to [${LOG_LEVEL}]`);
        return;;
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
    ['TRACE'].includes(LOG_LEVEL) && whisper('gm', `${$method}:${$num}`);
  }
  const whisper = function ($who, $content) {
    const chatMessage = `/w ${$who} ${apiMessage($content)}`;
    sendChat(scriptName, chatMessage);
  }
  const showCalendar = function ($who = 'gm') {
    whisper($who, `${header(calendar.dateStr())}`);
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
    log('Exception:');
    log(JSON.stringify($e));
    log('Message:');
    log(JSON.stringify($msg));
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

  // #region Schema
  class Month {
    constructor($fullName, $shortName, $numericName, $days) {
      this.fullName = $fullName; // string, e.g. 'January'
      this.shortName = $shortName; // string, e.g. 'Jan'
      this.numericName = $numericName; // string, e.g. '01'
      this.days = $days; // integer, number of days in the month
    }
  }

  class DnDate {
    constructor($year, $dayOfYear) {
      this.year = $year; // integer
      this.dayOfYear = $dayOfYear; // integer, 1-based
    }
  }

  class Alarm {
    constructor($name, $date, $message) {
      this.name = $name; // string, unique
      this.date = $date; // DnDate
      this.message = $message; // string, optional
    }
  }

  class Calendar {
    // #region CREATTION
    constructor($schemaVersion = schemaVersion, $date = { ...defaultDate }, $months = [...defaultMonths], $alarms = [], $format = defaultFormat) {
      this.schemaVersion = $schemaVersion; // MAJOR.MINOR.REVISION
      this.date = $date; // DnDate
      this.months = $months; // array of Month objects
      this.alarms = $alarms; // array of Alarm objects
      this.format = $format; // string, date format
    }
    static fromState($state) {
      return new Calendar($state.schemaVersion, $state.date, $state.months, $state.alarms, $state.format);
    }
    // #endregion CREATTION

    // #region GETTERS
    date() {
      return this.date;
    }
    months() {
      return this.months;
    }
    alarms() {
      return this.alarms;
    }
    daysInYear() {
      return this.months.reduce((acc, month) => acc + month?.days ?? 0, 0);
    }
    // #endregion GETTERS

    // #region DATE FUNCTIONS
    addDay = function ($days) {
      trace('addDay', 1);
      if (isNaN($days)) {
        throw new Error(`Invalid number of days [${$days}]`);
      }
      this.date = this.addDays($days, this.date);
      updateState();
    }

    /**
     * Adds the specified number of days to the date
     * @param {number} $days the number of days to add (use negative numbers to subtract)
     * @param {*} $date the date to add days to
     * @returns a new DnDate object with the specified number of days added
     */
    addDays($days, $date = this.date) {
      trace('addDays', 1);
      const days = parseInt($days);
      if (isNaN(days)) {
        throw new Error(`Invalid number of days [${$days}]`);
      }
      let dayOfYear = $date.dayOfYear + days;
      let year = $date.year;
      const daysInYear = this.daysInYear();

      if (dayOfYear > daysInYear) {
        const yearsToAdd = Math.floor(dayOfYear / daysInYear);
        dayOfYear -= yearsToAdd * daysInYear;
        year += yearsToAdd;
      } else if (dayOfYear < 1) {
        let daysFromEndOfYear = Math.abs(dayOfYear) % daysInYear;
        let yearsToRemove = Math.ceil(Math.abs(dayOfYear) / daysInYear) + 1;
        debug(`addDays: ${JSON.stringify({ dayOfYear, daysInYear, yearsToRemove })}`);
        dayOfYear = daysInYear - daysFromEndOfYear;
        year -= yearsToRemove;
      }
      debug(`addDays: ${JSON.stringify({ year, dayOfYear })}`);
      return new DnDate(year, dayOfYear);
    }
    setDate($args) {
      trace('setDate', 1);
      // TODO: suggestion const [date,] = this.parseDateArgs($args);
      const [date, ...remainingArgs] = this.parseDateArgs($args);
      this.date = date;
      updateState();
    }
    dateStr($date = this.date, $format = 'YYYY-MM-DD') {
      trace('dateStr', 1);
      if ($format == 'YYYY DOY') {
        return `${$date.year} ${$date.dayOfYear}`;
      }
      const info = this.dateInfo($date);
      switch ($format) {
        case 'YYYY-MM-DD':
          return `${info.year}-${info.month.numericName}-${info.day.toString().padStart(2, '0')}`;
        case 'MM/DD/YYYY':
          return `${info.month.numericName}/${info.day}/${info.year}`;
        case 'DD MMM YYYY':
          return `${info.day} ${info.month.shortName} ${info.year}`;
        case 'DD MMMM YYYY':
          return `${info.day} ${info.month.fullName} ${info.year}`;
        default:
          throw new Error(`Unknown date format [${$format}]`);
      }
    }
    dateFromParts($year, $month, $day) {
      trace('dateFromParts', 1);
      const months = this.months.slice(0, $month - 2);
      const dayOfYear = months.reduce((acc, month) => acc + month.days, 0) + $day;
      debug(`dateFromParts(${$year}, ${$month}, ${$day}) => dayOfYear: ${dayOfYear}`);
      return new DnDate($year, dayOfYear);
    }
    dateFromStr($str) {
      trace('dateFromStr', 1);
      // Check for YYYY-MM-DD format
      let matches = /^(\d+)[-/.](\d+)[-/.](\d+)$/.exec($str);
      if (matches) {
        matches.shift();// remove the full match
        const year = parseInt(matches.shift());
        const month = parseInt(matches.shift());
        const day = parseInt(matches.shift());
        const date = this.dateFromParts(year, month, day);
        if (date.dayOfYear < 1 || date.dayOfYear > this.daysInYear()) {
          throw new Error(`Invalid day of year [${dayOfYear}]`);
        }
        return date;
      } else {
        throw new Error(`Unknown date format [${$str}] ... expected YYYY-MM-DD`);
      }
    }
    /**
     * Gets calendar info for the specified date
     * @param {DnDate} $date the date to get the info for (DEFAULT: this.date)
     * @returns an object wit the day (of the month), the month object, and year
     */
    dateInfo($date = this.date) {
      trace('dateInfo', 1);
      let year = $date.year;
      let dayOfYear = $date.dayOfYear;
      let months = this.months;
      if (dayOfYear < 1) {
        throw new Error(`Invalid dayOfYear(${dayOfYear})`);
      }
      let dayOfMonth = dayOfYear;
      let monthIndex = 0;
      while (dayOfMonth > months[monthIndex].days) {
        dayOfMonth -= months[monthIndex++].days;
        if (monthIndex >= months.length) {
          monthIndex = 0;
          ++year;
        }
      }
      return {
        day: dayOfMonth,
        month: months[monthIndex],
        year: year
      };
    }
    parseDateArgs($args) {
      trace('parseDateArgs', 1);
      const args = [...$args];
      let arg = args.shift();
      let date;
      if (isNaN(arg)) {
        trace('parseDateArgs', 2);
        date = this.dateFromStr(arg);
        trace('parseDateArgs', 3);
      } else {
        trace('parseDateArgs', 4);
        const year = parseInt(arg);
        arg = args.shift();
        if (isNaN(arg)) {
          throw new Error(`Invalid date args: [${$args.join(', ')}]`);
        }
        const dayOfYear = parseInt(arg);
        date = new DnDate(year, dayOfYear);
        trace('parseDateArgs', 5);
      }
      debug(`Parsed date: ${JSON.stringify(date)}`);
      if (date.dayOfYear < 1 || date.dayOfYear > this.daysInYear()) {
        throw new Error(`Invalid day of year [${dayOfYear}]`);
      }
      return [date, args];
    }
    // #endregion DATE FUNCTIONS

    // #region ALARM FUNCTIONS
    parseAlarmArgs = function ($args) {
      trace('parseAlarmArgs', 1);
      if ($args.length < 2) {
        throw new Error(`Not enough arguments for alarm: [${$args.join(', ')}]`);
      }
      const args = [...$args];
      const name = args.shift();
      const [date, ...remainingArgs] = this.parseDateArgs(args);
      const message = remainingArgs.join(' ');
      return { name, date, message };
    }

    addAlarm = function ($args) {
      trace(`addAlarm(${$args})`, 1);
      const alarm = this.parseAlarmArgs($args);
      if (this.alarms.find(a => a.name == alarm.name)) {
        throw new Error(`An alarm with the name [${alarm.name}] already exists`);
      }
      this.alarms.push(alarm);
      updateState();
    }

    editAlarm = function ($args) {
      trace('editAlarm', 1);
      const alarm = this.parseAlarmArgs($args);
      const existing = this.alarms.find(a => a.name == alarm.name);
      if (!existing) {
        throw new Error(`No alarm with the name [${alarm.name}] exists`);
      }
      existing.date = alarm.date;
      existing.message = alarm.message;
      updateState();
    }

    deleteAlarm = function ($args) {
      trace('deleteAlarm', 1);
      if ($args.length < 1) {
        throw new Error(`No alarm name specified`);
      }
      const name = $args.shift();
      const index = this.alarms.findIndex(a => a.name == name);
      if (index < 0) {
        throw new Error(`No alarm with the name [${name}] exists`);
      }
      this.alarms.splice(index, 1);
      updateState();
    }

    renameAlarm = function ($args) {
      trace('renameAlarm', 1);
      if ($args.length < 2) {
        throw new Error(`Not enough arguments for alarm rename: [${$args.join(', ')}]`);
      }
      const oldName = $args.shift();
      const newName = $args.shift();
      const alarm = this.alarms.find(a => a.name == oldName);
      if (!alarm) {
        throw new Error(`No alarm with the name [${oldName}] exists`);
      }
      if (this.alarms.find(a => a.name == newName)) {
        throw new Error(`An alarm with the name [${newName}] already exists`);
      }
      alarm.name = newName;
      updateState();
    }
    // #endregion ALARM FUNCTIONS
  }
  // #endregion Schema

  // #region DEFAULTS
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
  const defaultDate = new DnDate(1, 1);
  const defaultAlarms = [];
  const defaultFormat = 'YYYY-MM-DD';
  // #endregion DEFAULTS
})();