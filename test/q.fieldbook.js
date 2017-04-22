describe('Q Fieldbook Extensions', function () {
  describe('resolveObject', function () {
    it('should resolve an object with promise keys', function () {
      let obj = {
        foo: Q('bar'),
        zip: 'zoo',
        cats: Q().thenResolve('dogs'),
      }

      return expect(Q.resolveObject(obj)).eventually.deep.equal({
        foo: 'bar',
        zip: 'zoo',
        cats: 'dogs',
      })
    })

    it('should resolve an object with promise keys', function () {
      let obj = {
        foo: Q('bar'),
        zip: 'zoo',
        cats: Q().thenResolve('dogs'),
      }

      return expect(Q.resolveObject(obj, 'foo', 'cats')).eventually.deep.equal({
        foo: 'bar',
        cats: 'dogs',
      })
    })
  })
})
