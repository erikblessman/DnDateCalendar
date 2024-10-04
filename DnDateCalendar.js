const DnDateCalendar = (() => {

  const scriptName = "DnDateCalendar";
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

  const sendException = function ($e, $msg) {
    sendChat('TokenMod', `/w gm ` +
      `<div style="border:1px solid black; background-color: #fee; padding: .2em; border-radius:.4em;" >` +
      `<div>There was an error while trying to run your command:</div>` +
      `<div style="margin: .1em 1em 1em 1em;"><code>${$msg.content}</code></div>` +
      `<div style="font-size: .6em; line-height: 1em;margin:.1em .1em .1em 1em; padding: .1em .3em; color: #666666; border: 1px solid #999999; border-radius: .2em; background-color: white;">` +
      JSON.stringify({ msg: $msg, version: version, stack: $e.stack }) +
      `</div>` +
      `</div>`
    );
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
      sendChat('DnDateCalendar', `/w gm invalid number of days [${$days}]`);
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
      default:
        sendChat('DnDateCalendar', `/w gm unknown command [${$msg.content}]`);
        break;
    }
    showCalendar();
  };

  const showCalendar = function () {
    const dateStr = getDateStr();
    sendChat('DnDateCalendar', `/w gm ` +
      `<div style="border:1px solid black; background-color: #fee; padding: .2em; border-radius:.4em;" >` +
      `<div style="font-size: 1.2em; font-weight: bold; text-align: center;">${dateStr}</div>` +
      `</div>`
    );
  }
  // #endregion MESSAGE ROUTING

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