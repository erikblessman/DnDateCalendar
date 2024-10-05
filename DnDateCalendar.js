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
        ]
      };
    }
  }
  // #endregion UTILITY FUNCTIONS

  // #region DATE FUNCTIONS
  const getDate = function ($dayOfYear, $months, $year) {
    if ($dayOfYear < 1) {
      log(`Invalid dayOfYear(${$dayOfYear})`);
      return null;
    }
    let dayOfMonth = $dayOfYear;
    let monthIndex = 0;
    while (dayOfMonth > $months[monthIndex].days) {
      dayOfMonth -= $months[monthIndex++].days;
      if (monthIndex >= $months.length) {
        monthIndex = 0;
        ++$year;
      }
    }
    return {
      day: dayOfMonth,
      month: $months[monthIndex],
      year: $year
    };
  }

  const getDateStr = function () {
    const date = getDate(state[scriptName].dayOfYear, state[scriptName].months, state[scriptName].year);
    return `${date.day} ${date.month.name} ${date.year}`;
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
    args.shift();
    switch (args[0]) {
      case 'next':
        addDay(1);
        break;
      case 'prev':
        addDay(-1);
        break;
      case 'add':
        addDay(args[1]);
        break;
      case 'reset':
        delete state[scriptName];
        initState();
        break;
      case 'help':
        const who = args.length > 1 ? args[1] : $msg.who;
        showHelp(who);
        return;
      default:
        throw new Error(`Unknown command [${$msg.content}]`);
    }
    showCalendar();
  };
  // #endregion MESSAGE ROUTING

  // #region DISPLAY FUNCTIONS
  const whisper = function ($who, $content) {
    const chatMessage = `/w ${$who} ${apiMessage($content)}`;
    sendChat(scriptName, chatMessage);
  }
  const shout = function ($content) {
    sendChat(scriptName, apiMessage($content));
  }
  const apiMessage = function ($content) {
    const style = 'border:1px solid black; background-color: #fee; padding: .2em; border-radius:.4em;';
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
    return table($items);
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
      ['!dndate reset', 'reset the date to the default'],
      ['!dndate help', 'show this help message']
    ];
    whisper($who, header(`${scriptName} Help`) + list(commands));
  }

  const sendException = function ($e, $msg) {
    const errorStyle = `margin: .1em 1em 1em 1em; font-size: 1em; color: #333; text-align: center;`;
    const errorStr = `<div style="${errorStyle}">${$e?.message ?? 'Unknown Error'}</div>`;
    log(`>>>>>>>>>>>>>>>>> ${scriptName} Error <<<<<<<<<<<<<<<<<`);
    log('Exception:');
    log(JSON.stringify($e));
    log('Message:');
    log(JSON.stringify($msg));
    whisper('gm', header(`${scriptName} Error`) + errorStr);
  }
  // #endregion DISPLAY FUNCTIONS

  // #region EVENT HANDLERS
  const onChatMessage = function ($msg) {
    try {
      if (!isApiMsg($msg)) {
        return;
      }
      routeMessage($msg);
    } catch (e) {
      sendException(e, $msg);
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