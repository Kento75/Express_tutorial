var winston = require('winston');

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  verbose: 3,
  debug: 4,
  silly: 5,
}

function Logger() {
  return winston.add(winston.transports.File, {
    filename: 'log/warning.log',
    maxsize: 1048576,
    level: 'warn',
  });
}

module.exports = new Logger();
