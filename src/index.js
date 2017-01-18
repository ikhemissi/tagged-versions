/**
 * Query github for semantic version tag.
 *
 * @typedef {{tag: string, version: string, hash: string, date: Date}} Tag
 */

'use strict';

const semver = require('semver');
const childProcess = require('child-process-promise');

const tagRegex = /tag:\s*([^,)]+)/g;
const commitDetailsRegex = /.*?(tag:\s*([^,)]+).*);(.+);(.+)/;

/**
 * Run shell command and resolve with stdout content
 *
 * @param  {string} command Shell command
 * @return {Promise<string,Error>}
 */
function runCommand(command) {
  return childProcess.exec(command)
    .then(result => result.stdout);
}

/**
 * Return first semantic version tag name in the list reference.
 *
 * @param  {string} allTags Comma seprated list of tag name
 * @param  {string} guess   Last tag match
 * @return {string}
 */
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

/**
 * Parse commit into an array of tag object.
 *
 * @param  {string} line Line to parse
 * @return {Tag}
 */
function parseLine(line) {
  const match = commitDetailsRegex.exec(line);

  if (!match || match.length < 5) {
    return null;
  }

  const tag = getFirstValidTag(match[1], match[2]);
  const version = semver.valid(tag);

  if (!version) {
    return null;
  }

  const hash = match[3].trim();
  const date = new Date(match[4].trim());

  return { tag, hash, date, version };
}

/**
 * Filter tags with range.
 *
 * Skip filtering if the range is not set.
 *
 * @param  {Array<Tag>} tags  List of tags
 * @param  {string}     range Semantic range to filter with.
 * @return {Array<Tag>}
 */
function filterByRange(tags, range) {
  if (!range) {
    return tags;
  }

  return tags.filter(tag => semver.satisfies(tag.version, range));
}

/**
 * Compare tag by version.
 *
 * @param  {Tag} a First tag
 * @param  {Tag} b Second tag
 * @return {number}
 */
function compareTag(a, b) {
  return semver.rcompare(a.version, b.version);
}

/**
 * Get list of tag with a  semantic version name.
 *
 * @param  {object|string} options       Options map or range string
 * @param  {string}        options.range Semantic range to filter tag with
 * @param  {string}        options.rev   Revision range to filter tag with
 * @return {Promise<Array<Tag>,Error>}
 */
function getList(options) {
  const range = isString(options) ? options : (options && options.range);
  const rev = options && options.rev;
  const fmt = '--pretty="%d;%H;%ci" --decorate=short';
  const cmd = rev ? `git log --simplify-by-decoration ${fmt} ${rev}` : `git log --no-walk --tags ${fmt}`;

  return runCommand(cmd).then((output) => {
    const lines = output.split('\n');
    const tags = lines
      .map(parseLine)
      .filter(tag => tag != null);

    return filterByRange(tags, range).sort(compareTag);
  });
}

/**
 * Get most recent tag.
 *
 * @param  {object|string} options       Options map or range string
 * @param  {string}        options.range Semantic range to filter tag with
 * @param  {string}        options.rev   Revision range to filter tag with
 * @return {Promise<Tag,Error>}
 */
function getLastVersion(options) {
  return getList(options)
    .then(list => list[0]);
}

module.exports = {
  getList,
  getLastVersion,
};
