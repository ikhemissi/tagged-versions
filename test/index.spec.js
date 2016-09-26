'use strict';

const test = require('ava');
const sinon = require('sinon');
const childProcess = require('child-process-promise');
const taggedVersions = require('../src');

const gitLog = `
HEAD -> master, tag: v1.2.0, origin/master, origin/HEAD;f6bf448b02c489c8676f2eeaaac72ef93980baf2
tag: v1.1.1;b656238b0fc2502b19bd0e803eb87447840dc52a
tag: v1.1.0;1d56b88b0fc2585ffaf43e416b87440667c3c53f
tag: v1.0.0;06743d3f902b19bd0e802e40462d87ba2b05740d
`;

const versions = {
  '1.2.0': {
    version: '1.2.0',
    tag: 'v1.2.0',
    hash: 'f6bf448b02c489c8676f2eeaaac72ef93980baf2',
  },
  '1.1.1': {
    version: '1.1.1',
    tag: 'v1.1.1',
    hash: 'b656238b0fc2502b19bd0e803eb87447840dc52a',
  },
  '1.1.0': {
    version: '1.1.0',
    tag: 'v1.1.0',
    hash: '1d56b88b0fc2585ffaf43e416b87440667c3c53f',
  },
  '1.0.0': {
    version: '1.0.0',
    tag: 'v1.0.0',
    hash: '06743d3f902b19bd0e802e40462d87ba2b05740d',
  },
};

test.beforeEach(t => {
    t.context.exec = childProcess.exec;
    childProcess.exec = sinon.stub().returns(Promise.resolve({ stdout: gitLog }));
});

test.afterEach(t => {
    childProcess.exec = t.context.exec;
});

test('return all tagged versions', (t) => {
    return taggedVersions.getList()
      .then((list) => {
          t.deepEqual(list, [versions['1.2.0'], versions['1.1.1'], versions['1.1.0'], versions['1.0.0']]);
      });
});

test('return all tagged versions within a range', (t) => {
    return taggedVersions.getList('^1.1.0')
      .then((list) => {
          t.deepEqual(list, [versions['1.2.0'], versions['1.1.1'], versions['1.1.0']]);
      });
});

test('return last tagged version', (t) => {
    return taggedVersions.getLastVersion()
      .then((version) => {
          t.deepEqual(version, versions['1.2.0']);
      });
});

test('return last tagged version within a range', (t) => {
    return taggedVersions.getLastVersion('~1.1')
      .then((version) => {
          t.deepEqual(version, versions['1.1.1']);
      });
});
