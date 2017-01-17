'use strict';

const semver = require('semver');
const childProcess = require('child-process-promise');

const tagRegex = /tag:\s*([^,)]+)/g;
const commitDetailsRegex = /.*?(tag:\s*([^,)]+).*);(.+);(.+)/;

function runCommand(command) {
  return childProcess.exec(command)
    .then(result => result.stdout);
}

function getFirstValidTag(allTags, guess) {
  let match;
  let result = guess;
  while (match = tagRegex.exec(allTags)) {
    if (semver.valid(match[1])) {
      result = match[1];
      break;
    }
  }

  return result;
}

function isString(v) {
  return typeof v === 'string';
}

function getList(options) {
  const range = isString(options) ? options : (options && options.range);
  const rev = options && options.rev;
  const fmt = '--pretty="%d;%H;%ci" --decorate=short';
  const cmd = rev ? `git log --simplify-by-decoration ${fmt} ${rev}` : `git log --no-walk --tags ${fmt}`;

  return runCommand(cmd)
    .then(output => output.split('\n'))
    .then(lines => lines.map(line => commitDetailsRegex.exec(line)))
    .then(tags => tags.filter(tagAndHash => Array.isArray(tagAndHash) && tagAndHash.length === 5))
    .then(tags => tags.map((details) => {
      const tag = getFirstValidTag(details[1], details[2]);
      const hash = details[3].trim();
      const date = new Date(details[4].trim());
      return { tag, hash, date, version: semver.valid(tag) };
    }))
    .then(tags => tags.filter(details => !!details.version))
    .then(tags => tags.filter(details => !range || semver.satisfies(details.version, range)))
    .then(tags => tags.sort((t1, t2) => semver.rcompare(t1.version, t2.version)));
}

function getLastVersion(options) {
  return getList(options)
    .then(list => list[0]);
}

module.exports = {
  getList,
  getLastVersion,
};
