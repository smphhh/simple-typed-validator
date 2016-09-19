
import * as chai from 'chai';

import {
    createParameterParser,
    ParameterParserError,
    QueryParser
} from '../';

let expect = chai.expect;

describe("Simple Typed Query", function () {

    it("should parse strings", function () {
        let parser = new QueryParser({ value: 'foo' });

        let value = parser.parse('value')
            .asString()
            .getValue();

        expect(value).to.equal('foo');            
    });

    it("should parse numbers", function () {
        let parser = new QueryParser({ value: '1' });

        let foo = parser.parse('value')
            .asNumber()
            .getValue();

        expect(foo).to.equal(1);            
    });

    it("should parse dates in ISO format", function () {
        let date = new Date();

        let parser = new QueryParser({ value: date.toISOString() });

        let parsedDate = parser.parse('value')
            .asDate()
            .getValue();

        expect(parsedDate).to.deep.equal(date);
    });

    it("should parse booleans", function () {
        let parsedValue: boolean;

        parsedValue = createParameterParser({ value: 'true' }, 'value')
            .asBoolean()
            .getValue();

        expect(parsedValue).to.equal(true);

        parsedValue = createParameterParser({ value: 'FalSe' }, 'value')
            .asBoolean()
            .getValue();

        expect(parsedValue).to.equal(false);

    });

    it("should error on missing required parameter", function () {
        expect(() => {
            let parsedValue = createParameterParser({}, 'value')
                .asString()
                .require()
                .getValue();

        }).to.throw(ParameterParserError);
    });
});
