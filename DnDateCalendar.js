const DnDateCalendar = (() => {

  const scriptName = 'DnDateCalendar';
  const version = '0.0.1';
  const schemaVersion = 0.1;

  // #region UTILITY FUNCTIONS
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

  const initState = function () {
    if (!state[scriptName]) {
      state[scriptName] = {
        schemaVersion: schemaVersion,
        dayOfYear: 1,
        year: 1999,
        months: [
          { name: 'January', days: 31 },
          { name: 'February', days: 28 },
          { name: 'March', days: 31 },
          { name: 'April', days: 30 },
          { name: 'May', days: 31 },
          { name: 'June', days: 30 },
          { name: 'July', days: 31 },
          { name: 'August', days: 31 },
          { name: 'September', days: 30 },
          { name: 'October', days: 31 },
          { name: 'November', days: 30 },
          { name: 'December', days: 31 }
        ],
      };
    }
  }
  // #endregion UTILITY FUNCTIONS

  // #region DATE FUNCTIONS
  const getDate = function ($dayOfYear, $year, $months) {
    let dayOfYear = $dayOfYear ?? state[scriptName].dayOfYear;
    let year = $year ?? state[scriptName].year;
    let months = $months ?? state[scriptName].months;
    if (dayOfYear < 1) {
      log(`Invalid dayOfYear(${dayOfYear})`);
      return null;
    }
    let dayOfMonth = dayOfYear;
    let monthIndex = 0;
    while (dayOfMonth > months[monthIndex].days) {
      dayOfMonth -= months[monthIndex++].days;
      if (monthIndex >= months.length) {
        monthIndex = 0;
        ++$year;
      }
    }
    return {
      day: dayOfMonth,
      month: months[monthIndex],
      year: year
    };
  }

  const getDateStr = function ($date) {
    const date = $date ?? getDate();
    return `${date.day} ${date.month.name} ${date.year}`;
  }

  const getDayOfYear = function ($month, $day, $months) {
    let months = $months ?? state[scriptName].months;
    return months.slice(0, $month - 1).reduce((acc, month) => acc + month.days, 0) + $day;
  }

  const addDay = function ($days) {
    if (isNaN($days)) {
      sendChat(scriptName, `/w gm invalid number of days [${$days}]`);
      return;
    }
    const days = parseInt($days);
    let newDayOfYear = state[scriptName].dayOfYear + days;
    let newYear = state[scriptName].year;
    const daysInYear = state[scriptName].months.reduce((acc, month) => acc + month.days, 0);

    if (newDayOfYear > daysInYear) {
      const yearsToAdd = Math.floor(newDayOfYear / daysInYear);
      newDayOfYear -= yearsToAdd * daysInYear;
      newYear += yearsToAdd;
    } else if (newDayOfYear < 1) {
      const yearsToRemove = Math.ceil(Math.abs(newDayOfYear) / daysInYear);
      newDayOfYear += yearsToRemove * daysInYear;
      newYear -= yearsToRemove;
    }
    state[scriptName].dayOfYear = newDayOfYear;
    state[scriptName].year = newYear;
  }
  // #endregion DATE FUNCTIONS

  // #region MESSAGE ROUTING
  const routeMessage = function ($msg) {
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
          case 'add': addAlarm(args); break;
          case 'edit': editAlarm(args); break;
          case 'delete': deleteAlarm(args); break;
          default: throw new Error(`Unknown alarm command [${command2}]`);
        }
        showAlarms();
        return;
      case 'next':
        addDay(1);
        break;
      case 'prev':
        addDay(-1);
        break;
      case 'add':
        addDay(args.shift());
        break;
      case 'reset':
        delete state[scriptName];
        initState();
        break;
      case 'help':
        const who = args.length > 0 ? args[0] : $msg.who;
        showHelp(who);
        return;
      default:
        throw new Error(`Unknown command [${$msg.content}]`);
    }
    showCalendar();
  };
  // #endregion MESSAGE ROUTING

  // #region ALARM FUNCTIONS
  const parseAlarmArgs = function ($args) {
    const name = $args.shift();
    const arg2 = $args.shift();
    let matches = /^(\d+)[-.](\d+)[-.](\d+)/.exec(arg2);
    if (matches) {
      const year = parseInt(matches[0]);
      const month = parseInt(matches[1]);
      const day = parseInt(matches[2]);
      const message = $args.join(' ');
      const dayOfMonth = getDayOfYear(month, day);
      return { name, year, dayOfMonth, message };
    }
    const year = arg2;
    const arg3 = $args.shift();
    const dayOfYear = parseInt(arg3);
    const message = $args.join(' ');
    return { name, year, dayOfYear, message };
  }
  const addAlarm = function ($args) {
    const alarm = parseAlarmArgs($args);
    if (state[scriptName].alarms.find(a => a.name == alarm.name)) {
      throw new Error(`Alarm [${alarm.name}] already exists`);
    }
    state[scriptName].alarms.push(alarm);
  }
  const editAlarm = function ($args) {
    const alarm = parseAlarmArgs($args);
    const existingAlarm = state[scriptName].alarms.find(a => a.name == alarm.name);
    existingAlarm.year = alarm.year;
    existingAlarm.dayOfYear = alarm.dayOfYear;
    existingAlarm.message = alarm.message;
  }
  const deleteAlarm = function ($args) {
    const name = $args.shift();
    const index = state[scriptName].alarms.findIndex(a => a.name == name);
    if (index == -1) {
      throw new Error(`Alarm [${name}] not found`);
    }
    state[scriptName].alarms.splice(index, 1);
  }
  // #region ALARM FUNCTIONS

  // #region SHOW/CHAT FUNCTIONS
  const trace = function ($method, $num) {
    sendChat(scriptName, `/w gm ${$method}:${$num}`);
  }
  const whisper = function ($who, $content) {
    const chatMessage = `/w ${$who} ${apiMessage($content)}`;
    sendChat(scriptName, chatMessage);
  }
  const showCalendar = function () {
    const dateStr = getDateStr();
    sendChat(scriptName, `/w gm ${apiMessage(header(dateStr))}`);
  }
  const showHelp = function ($who) {
    const commands = [
      ['!dndate', 'show the current date'],
      ['!dndate next', 'advance the date by one day'],
      ['!dndate prev', 'go back one day'],
      ['!dndate add DAYS', 'add the specified number of days to the date (e.g. !dndate add 5 OR !dndate add -45)'],
      ['!dndate alarms', 'show this help message'],
      ['!dndate alarm add|edit NAME DATE MESSAGE', 'add or edit an alarm'],
      ['!dndate reset', 'reset the date to the default'],
      ['!dndate help [WHO]', 'show this help message (e.g. !dndate help William)'],
    ];
    whisper($who, header(`${scriptName} Help`) + table(commands));
    const notes = [
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
    const alarms = state[scriptName]?.alarms;
    if (!alarms || alarms.length == 0) {
      whisper('gm', header('Alarms') + 'No alarms set');
      return;
    }
    const alarmRows = alarms.map(a => [a.name, getDateStr(getDate(a.dayOfYear, a.year, state[scriptName].months)), a.message]);
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
})();