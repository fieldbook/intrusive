require('./init');

describe('Underscore mixins', function () {
  describe('ensurePath', function () {
    var noop, addFull, addPart, addArray;
    var path = ["foo", "bar", "baz"];
    noop = {foo: {bar: {baz: {}}}, qux: 1}
    addFull = {qux: 1};
    addPart = {foo: {}, qux: 1};
    addArray = {foo: {}, qux: 1};

    it('should ensure a path that already exists', function () {
      _.ensurePath(noop, path);
      return expect(noop).deep.equal({foo: {bar: {baz: {}}}, qux: 1});
    })

    it('should ensure a path that does not exist', function () {
      _.ensurePath(addFull, path);
      return expect(addFull).deep.equal({foo: {bar: {baz: {}}}, qux: 1});
    })

    it('should ensure a path that partly exists', function () {
      _.ensurePath(addPart, path);
      return expect(addPart).deep.equal({foo: {bar: {baz: {}}}, qux: 1});
    })

    it('should ensure a path that terminates in an array', function () {
      _.ensurePath(addArray, path, []);
      return expect(addArray).deep.equal({foo: {bar: {baz: []}}, qux: 1});
    })
  })
})
