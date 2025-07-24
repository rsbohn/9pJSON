const client = require('../client');
const ixp = require('../index').Server();
const maybe = require('../maybe').maybe;

const OWRITE = 1;

ixp.tree.mkfile(
  '/temp',
  undefined,
  function (o, n) {
    return this.data.substr(o, n);
  },
  function (o, d) {
    this.data = maybe(this.data).orElse('') + d;
    return d.length;
  },
  function () {
    // no-op close
  },
);

test("Can't write to unopened fid.", () => {
  client.attach(ixp, (request, reply) => {
    const target = ixp.tree.lookup('/temp');
    expect(target.data).toBeUndefined();
    let fixture = ixp.Twalk({
      fid: request.fid,
      tag: 1,
      newfid: 101,
      nwname: 1,
      wname: ['temp'],
    });
    fixture = ixp.Twrite({ fid: 101, tag: 1, offset: 0, data: 'nothing' });
    expect(fixture.type).toBe(ixp.msgtype.Rerror);
    expect(fixture.ename).toBe('fid not open');
  });
});

test('Open then write.', () => {
  const target = ixp.tree.lookup('/temp');
  client.attach(ixp, (request, reply) => {
    expect(target.data).toBeUndefined();
    let fixture = ixp.Twalk({
      fid: request.fid,
      tag: 1,
      newfid: 101,
      nwname: 1,
      wname: ['temp'],
    });

    fixture = ixp.Topen({ fid: 101, tag: 1, mode: OWRITE });
    expect(fixture.ename).toBeUndefined();
    expect(fixture.type).toBe(ixp.msgtype.Ropen);
    fixture = ixp.Twrite({ fid: 101, tag: 1, offset: 0, data: 'french fries' });
  });
  expect(target.data).toBe('french fries');
});
