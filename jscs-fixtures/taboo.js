var someObject = {}

someObject.tabooName = 'should error';

someObject['tabooName'] = 'fine; computed member expressions are not checked';

var otherTabooName = 'should error';

if (otherTabooName) {
  console.log('should error');
}
