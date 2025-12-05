import * as math from 'mathjs';
export default class Tax {
  static compute(type: string, value: number, rate: number) {
    switch (type) {
      case 'inclusive':
        return Tax.computeInclusive(value, rate);
      case 'exclusive':
        return Tax.computeExclusive(value, rate)
    }
  }

  static computeInclusive(value: number, rate: number) {
    return math.chain(
      math.chain(value).divide(
        math.chain(rate).add(100).done()
      ).done()
    ).multiply(100).done();
  }

  static computeExclusive(value: number, rate: number) {
    return math.chain(value).divide(100).multiply(math.chain(rate).add(100).done()).done();
  }

  static getTaxValue(type: string, value: number, rate: number) {
    switch (type) {
      case 'inclusive':
        return value - <number>Tax.compute(type, value, rate);
      case 'exclusive':
        return <number>Tax.compute(type, value, rate) - value;
    }

    return 0;
  }
}
