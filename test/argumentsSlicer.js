var ArgumentsSlicer = require('../lib/argumentsSlicer');

describe('Arguments slicer', function () {
  // Test specific methods
  it('should tail arguments correctly', function () {
    let fn = function () {
      return ArgumentsSlicer.tail.apply(null, arguments);
    }

    expect(fn()).deep.equal([]);
    expect(fn(1)).deep.equal([]);
    expect(fn(1, 2, 3)).deep.equal([2, 3]);
  })

  it('should initial arguments correctly', function () {
    let fn = function () {
      return ArgumentsSlicer.initial.apply(null, arguments);
    }

    expect(fn()).deep.equal([]);
    expect(fn(1)).deep.equal([]);
    expect(fn(1, 2, 3)).deep.equal([1, 2]);
  })

  it('should last arguments correctly', function () {
    let fn = function () {
      return ArgumentsSlicer.last.apply(null, arguments);
    }

    expect(fn()).equal(undefined);
    expect(fn(1)).equal(1);
    expect(fn('a', 'b')).equal('b');
  })

  it('should map arguments correctly', function () {
    let fn = function () {
      return ArgumentsSlicer.map(x => x + 1).apply(null, arguments);
    }

    expect(fn()).deep.equal([]);
    expect(fn(1)).deep.equal([2]);
    expect(fn(1, 2, 3)).deep.equal([2, 3, 4]);
  })

  it('should each arguments correctly', function () {
    let fn = function () {
      let result = 0
      ArgumentsSlicer.map(x => { result += x }).apply(null, arguments);
      return result;
    }

    expect(fn()).equal(0);
    expect(fn(1)).equal(1);
    expect(fn(1, 2, 3)).equal(6);
  })

  it('should concat arguments correctly', function () {
    let fn = function () {
      return ArgumentsSlicer.concat([1, 2], [3, 4]).apply(null, arguments);
    }

    expect(fn()).deep.equal([1, 2, 3, 4]);
    expect(fn('a')).deep.equal([1, 2, 'a', 3, 4]);
    expect(fn('a', 'b', 'c')).deep.equal([1, 2, 'a', 'b', 'c', 3, 4]);
  })

  it('should push arguments correctly', function () {
    let fn = function () {
      return ArgumentsSlicer.push([3, 4]).apply(null, arguments);
    }

    expect(fn()).deep.equal([3, 4]);
    expect(fn('a')).deep.equal(['a', 3, 4]);
    expect(fn('a', 'b', 'c')).deep.equal(['a', 'b', 'c', 3, 4]);
  })

  it('should unshift arguments correctly', function () {
    let fn = function () {
      return ArgumentsSlicer.unshift([1, 2]).apply(null, arguments);
    }

    expect(fn()).deep.equal([1, 2]);
    expect(fn('a')).deep.equal([1, 2, 'a']);
    expect(fn('a', 'b', 'c')).deep.equal([1, 2, 'a', 'b', 'c']);
  })

  // Use [].slice as a reference implementation
  describe('comparison to Array.prototype.slice', function () {
    let argsCases = [
      [],
      ['zoo'],
      ['a', 'b'],
      [1, 2, 3, 4],
      'foo bar baz qux gribble gralt'.split(' '),
    ];

    let sliceArgsCases = [
      [],
      [1],
      [-1],
      [-3, -1],
      [0, -1],
      [1, 5],
      [3, 2],
      [2, 5],
      [2, -1],
      [20, -90],
      [20, 90],
      [-50, -100],
      [-100, -50],
    ];

    for (let sliceArgs of sliceArgsCases) {
      describe(`with slicer arguments ${JSON.stringify(sliceArgs)}`, function () { // eslint-disable-line no-loop-func
        let slicer = ArgumentsSlicer.make(...sliceArgs);
        let actual = function () {
          return slicer.apply(null, arguments);
        }

        let expected = function (args) {
          return args.slice(...sliceArgs);
        }

        for (let args of argsCases) {
          let expectation = expected(args);
          it(`should slice [${args}] correctly as [${expectation}]`, function () { // eslint-disable-line no-loop-func
            expect(actual(...args)).deep.equal(expectation);
          })
        }
      })
    }
  })
})
