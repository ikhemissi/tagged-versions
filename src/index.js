'use strict';

const semver = require('semver');
const childProcess = require('child-process-promise');
const tagAndHashRegex = /.*tag:([^,]+).*;(.+)/;

function getList(range) {
  return runCommand('git log --no-walk --tags --pretty="%D;%H" --decorate=short')
    .then(output => output.split('\n'))
    .then(lines => lines.map(line => tagAndHashRegex.exec(line)))
    .then(tags => tags.filter(tagAndHash => Array.isArray(tagAndHash) && tagAndHash.length === 3))
    .then(tags => tags.map(([_, tag, hash]) => ({ tag: tag.trim(), hash: hash.trim() })))
    .then(tags => tags.map(({ tag, hash }) => ({ hash, tag, version: semver.valid(tag) })))
    .then(tags => tags.filter(details => !!details.version))
    .then(tags => tags.filter(details => !range || semver.satisfies(details.version, range)))
    .then(tags => tags.sort((t1, t2) => semver.rcompare(t1.version, t2.version)));
}

function getLastVersion(range) {
  return getList(range)
    .then(list => list[0]);
}

function runCommand(command) {
  return childProcess.exec(command)
    .then(result => result.stdout);
}

module.exports = {
  getList,
  getLastVersion,
};
