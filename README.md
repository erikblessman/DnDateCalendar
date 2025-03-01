# DnDateCalendar API

## Roll20 Commands

### NOTES
- \* is used to mark commands that can only be performed by the GM
- ARGS in [BRACKETS] are optional
- Alternatives args are separated by | (as with !dndate alarm add|edit)
- DATE ARGS need to be in the format YYYY-MM-DD or YYYY DOY
- WHO ARGS are the player or character name to whisper to, as described in the [Roll20 Whsiper Documentation](https://wiki.roll20.net/Text_Chat#Whispers_.28.2Fw.29)

### Show Date
`!dndate` - show the current date

### Next Day
`!dndate next` - *move the date forward by one day

### Previous Day
`!dndate prev` - *move the date back by one day

### Add/Subtract Days to/from the Date
`!dndate add DAYS` - *add the specified number of days to the date
- DAYS should be a positive whole number to add days
- DAYS should be a negative whole number to subtract days
- e.g. !dndate add 5 OR !dndate add -45

### Set the Date
`!dndate set DATE` - *set the date to the specified date

### Show Alarms
`!dndate alarms` - *show this help message

### Add/Edit Alarm
`!dndate alarm add|edit NAME DATE MESSAGE` - *add or edit an alarm
- NAME is what the alarm will be known by, must be unique and have no spaces
- DATE is the date the alarm should be triggered when the current date moves from before this date to on/after this date
- MESSAGE is the message to whisper to the GM when the alarm is triggered

### Rename Alarm
`!dndate alarm rename OLDNAME NEWNAME` - *rename an alarm
- OLDNAME is the name of the alarm you want to rename
- NEWNAME is the name of the alarm you want to change to (must be unique)

### Reset Date
`!dndate reset` - *reset the DnDateCalendar to the default values/settings
- **IMPORTANT:** This clears out all data including, but not limited to, the date, the calendar (months/days/etc), and alarms

### Help
`!dndate help [WHO]` - whisper this help message (e.g. !dndate help William)'
- WHO is the player/character to whisper the help message to (when no value is provided, GM is assumed)

### Log the State
`!dndate logState` - Writes the state object to the API logs

### Set Log Level
`!dndate logLevel LEVEL` - Sets the level of message that will be whispered to the GM for debugging purposes
- LEVEL is either:
  - DEBUG (to whisper messages meant to debug changes to the system) o
  - TRACE (to whisper messages meant to show the logic flow of the API script)

# Testing

## Running Tests
To simply run the tests, use:
```
npm test
```

To run the tests as they change (via `jest --watch`), use
```
npm run testw
```