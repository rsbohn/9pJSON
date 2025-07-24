const ixp = require('../ixp');

const root = ixp.mkroot();
root.mkdir('/a').mkdir('b');
root.mkdir('/a/a').mkdir('b');
root.mkdir('/a/nother');
root.mkdir('/cows');

const isDir = ixp.isDir;
const isFile = ixp.isFile;

test('find a file', () => {
  expect(isDir(root.lookup('/a/a/b'))).toBe(true);
});

test('lookup_nother', () => {
  const fixture = root.lookup('/a').lookup('nother');
  expect(fixture.name).toBe('nother');
});

test('throws not found', () => {
  expect(() => {
    root.lookup('/a/c');
  }).toThrow(/not found/);
});

test('mkfile', () => {
  const k = { open: null, read: null, write: null, close: null };
  const parent = root.lookup('/a/b', false);
  const fixture = parent.mkfile('file0', k.open, k.read, k.write, k.close);
  expect(isFile(fixture)).toBe(true);
  expect(fixture.name).toBe('file0');
});
