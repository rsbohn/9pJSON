const util = require('../ixputil');
const ixp = require('../ixp');
const attach = require('../client').attach;

ixp.set_util(util);

const root = ixp.mkroot();
root.mkdir('/a');
root.mkdir('/cows');
ixp.Service.tree = root;
ixp.Service.send9p = (p) => p;
const verbose = false;

const pclunk = (fid) => ({ type: ixp.Tclunk, tag: 3000, fid });
const tname = (t) => ixp.packets[t].name;

test('Tread', () => {
  ixp.Service.verbose = false;
  let fixture = ixp.Service.answer({
    type: ixp.Topen,
    tag: 2000,
    fid: 1812,
    mode: 0,
  });
  expect(tname(fixture.type)).toBe('Ropen');

  const request = {
    type: ixp.Tread,
    tag: 2001,
    fid: 1812,
    count: 128,
    offset: 0,
  };
  fixture = ixp.Service.answer(request);
  expect(tname(fixture.type)).toBe('Rread');
  if (fixture.type === ixp.Rread) {
    expect(fixture.tag).toBe(2001);
    let dent = fixture.data;
    expect(dent.name).toBe('a');
    expect(dent.mode & 0o777).toBe(0o111);
    expect(dent.mode >>> 24).toBe(0x80);

    request.offset += fixture.data.length;
    request.tag++;
    fixture = ixp.Service.answer(request);
    expect(fixture.type).toBe(ixp.Rread);
    expect(fixture.tag).toBe(request.tag);
    dent = fixture.data;
    expect(dent.name).toBe('cows');

    request.offset += fixture.data.length;
    fixture = ixp.Service.answer(request);
    expect(fixture.tag).toBe(request.tag);
    expect(fixture.data).toBe('');

    request.tag++;
    fixture = ixp.Service.answer(request);
    expect(fixture.tag).toBe(request.tag);
    expect(fixture.data).toBe('');
  }

  const reply = ixp.Service.answer({
    type: ixp.Tclunk,
    tag: request.tag,
    fid: request.fid,
  });
  expect(tname(reply.type)).toBe('Rclunk');
});

test('dirent', () => {
  const fixture = ixp.dirent(root);
  expect(fixture.type).toBe('0');
  expect(fixture.name).toBe('/');
});

test('dirent_a', () => {
  const fixture = ixp.dirent(root.lookup('a'));
  expect(fixture.type).toBe('0');
  expect(fixture.name).toBe('a');
});

test('walker', () => {
  ixp.Service.verbose = verbose;
  attach(ixp.Service, (request, fixture) => {
    request.type = ixp.Twalk;
    request.newfid = 429;
    request.wname = ['cows'];
    request.nwname = request.wname.length;
    fixture = ixp.Service.answer(request);
    expect(fixture.type).toBe(ixp.Rwalk);
    expect(fixture.nqid).toBe(1);
    expect(fixture.qids[0]).toEqual(root.lookup('/cows').qid);
    ixp.Service.answer(pclunk(request.newfid));
  });
});

test('walk2', () => {
  ixp.Service.verbose = verbose;
  attach(ixp.Service, (request, reply) => {
    expect(reply.type).toBe(ixp.Rattach);
    const fixture = ixp.Service.answer({
      type: ixp.Twalk,
      tag: request.tag,
      fid: request.fid,
      newfid: 430,
      wname: ['cows', 'jersey'],
      nwname: 2,
    });
    expect(fixture.ename).toBe("Can't do plaid!");
  });
});

test('walk_self', () => {
  ixp.Service.verbose = verbose;
  attach(ixp.Service, (request, reply) => {
    expect(reply.type).toBe(ixp.Rattach);
    request.type = ixp.Twalk;
    request.newfid = request.fid + 1;
    request.nwname = 0;
    const fixture = ixp.Service.answer(request);
    expect(fixture.type).toBe(ixp.Rwalk);
    expect(fixture.nqid).toBe(0);
    expect(fixture.qids).toBeUndefined();
    ixp.Service.answer(pclunk(request.newfid));
  });
});

test('open_close', () => {
  attach(ixp.Service, (request, response) => {
    let fixture = ixp.Service.answer({
      type: ixp.Topen,
      tag: request.tag,
      fid: 435,
      mode: 0,
    });
    expect(fixture.ename).toBe('no such fid');

    fixture = ixp.Service.answer({
      type: ixp.Topen,
      tag: request.tag,
      fid: request.fid,
      mode: 0,
    });
    expect(tname(fixture.type)).toBe('Ropen');
  });
});

test('cat1', () => {
  root.mkfile(
    '/zero',
    null,
    (offset, count) => util.pad('', count, '\0'),
    null,
    null,
  );
  expect(root.lookup('/zero').read(0, 5)).toBe('\0\0\0\0\0');
  attach(ixp.Service, (request, response) => {
    ixp.Service.verbose = verbose;
    let fixture = ixp.Service.answer({
      type: ixp.Twalk,
      tag: request.tag,
      fid: request.fid,
      newfid: 440,
      wname: ['zero'],
      nwname: 1,
    });
    if (fixture.type !== ixp.Rwalk) return;
    fixture = ixp.Service.answer({
      type: ixp.Topen,
      tag: request.tag,
      fid: 440,
      mode: 0,
    });
    expect(tname(fixture.type)).toBe('Ropen');
    if (fixture.type === ixp.Ropen) {
      fixture = ixp.Service.answer({
        type: ixp.Tread,
        fid: 440,
        tag: request.tag,
        offset: 0,
        count: 5,
      });
      expect(tname(fixture.type)).toBe('Rread');
      expect(fixture.count).toBe(5);
      expect(fixture.data).toBe('\0\0\0\0\0');
    }
    ixp.Service.answer(pclunk(440));
  });
});

test('read unopened', () => {
  attach(ixp.Service, (request, response) => {
    expect(tname(response.type)).toBe('Rattach');
    const fixture = ixp.Service.answer({
      type: ixp.Tread,
      tag: request.tag,
      fid: request.fid,
    });
    expect(tname(fixture.type)).toBe('Rerror');
    expect(fixture.ename).toBe('fid not open');
  });
});

test('zzz', () => {
  const fidList = [];
  for (const x in ixp.Service.fids) {
    if (ixp.Service.fids[x] !== undefined) {
      fidList.push(x);
    }
  }
  expect(fidList.length).toBe(0);
});
