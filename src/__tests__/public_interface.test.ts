
import * as chai from 'chai';

import {
    createParameterParser,
    ParameterParserError,
    QueryParser
} from '../';

let expect = chai.expect;

describe("Simple Typed Query", function () {

    it("should validate strings", function () {
        let parser = new QueryParser({ value: 'foo' });

        let value = parser.parse('value')
            .asString()
            .getValue();

        expect(value).to.equal('foo');            
    });

    it("should not parse booleans as strings", function () {
        expect(() => {
            let parsedValue = createParameterParser({ value: true }, 'value')
                .asString()
                .getValue();

        }).to.throw(ParameterParserError);           
    });

    it("should validate numbers", function () {
        let parser = new QueryParser({ value: 1 });

        let foo = parser.parse('value')
            .asNumber()
            .getValue();

        expect(foo).to.equal(1);            
    });

    it("should parse numbers from strings", function () {
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

    it("should validate booleans", function () {
        let parsedValue: boolean;

        parsedValue = createParameterParser({ value: true }, 'value')
            .asBoolean()
            .getValue();

        expect(parsedValue).to.equal(true);
    });

    it("should parse booleans from strings", function () {
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
                .getValue();

        }).to.throw(ParameterParserError);
    });

    it("should not error on missing optional parameter", function () {
        let parsedValue = createParameterParser({}, 'value')
            .asString()
            .optional()
            .getValue();

        expect(parsedValue).to.be.undefined;
    });

    it("should use default values for missing parameters", function () {
        let parsedValue = createParameterParser({}, 'value')
            .asNumber()
            .defaultValue(5)
            .getValue();

        expect(parsedValue).to.equal(5);
    });
});
