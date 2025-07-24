const util = require('../ixputil');
const ixp = require('../ixp');
const attach = require('../client').attach;

ixp.set_util(util);

const root = ixp.mkroot();
ixp.Service.tree = root;
const verbose = false;
const tname = (t) => ixp.packets[t].name;

test('create directory', () => {
  ixp.Service.verbose = verbose;
  attach(ixp.Service, (request, response) => {
    expect(tname(response.type)).toBe('Rattach');
    const fixture = ixp.Service.answer({
      type: ixp.Tcreate,
      tag: request.tag,
      fid: request.fid,
      name: 'shoehorn',
      perm: 0x80000000 + 0o700,
      mode: 0,
    });
    expect(tname(fixture.type)).toBe('Ropen');
    const check = root.lookup('shoehorn');
    expect(ixp.isDir(check)).toBe(true);
  });
});
