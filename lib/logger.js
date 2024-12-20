import chalk from "chalk"

let currentLogLevel = 'default';

export function setLogLevel(level) {
  currentLogLevel = level;
}

function shouldLog(requestedLevel) {
  const levelMap = {
    verbose: 0,
    default: 1,
    quiet: 2,
  };

  return levelMap[requestedLevel] >= levelMap[currentLogLevel];
}

export function logVerbose(message) {
  if (shouldLog('verbose')) {
    console.log(chalk.blue('[VERBOSE]'), message);
  }
}

export function logDefault(message) {
  if (shouldLog('default')) {
    console.log(chalk.green('[DEFAULT]'), message);
  }
}

export function logQuiet(message) {
  if (shouldLog('quiet')) {
    console.log(chalk.yellow('[QUIET]'), message);
  }
}

export function logError(message) {
  console.error(chalk.red('[ERROR]'), message);
}