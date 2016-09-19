
export class EnumApiParameter<EnumValueType extends number, EnumType> {
    private values: EnumValueType[];

    constructor(
        private enumType: EnumType
    ) {
        this.values = Object.keys(this.enumType)
            .map(key => parseInt(key))
            .filter(value => isFinite(value))
            .sort()
            .map(value => value as EnumValueType);
    }

    getValues() {
        return this.values;
    }

    deserialize(value: string, allowNull?: boolean) {
        if (allowNull && !value) {
            return null;
        }

        let enumValue = this.enumType[value];

        if (enumValue !== undefined) {
            return enumValue as EnumValueType;
        } else {
            throw new Error(`Invalid enum string "${value}"`);
        }
    }

    serialize(value: EnumValueType): string {
        return this.enumType[value as number];
    }
}

export class CustomError extends Error {
    constructor(message) {
        super();
        this.message = message;
        this.stack = (new Error()).stack;
        this.name = (this.constructor as any).name;
    }
}

export class ParameterParserError extends CustomError {
    constructor(message: string) {
        super(message);
    }
}

export interface QueryParameterInterface<ValueType> {
    require(): this;
    asNumber(): QueryParameterInterface<number>;
    asDate(): QueryParameterInterface<Date>;
    asString(): QueryParameterInterface<string>;
    //toStringList(): QueryParameterInterface<string[]>;
    asBoolean(): QueryParameterInterface<boolean>;
    defaultValue(value: ValueType): QueryParameterInterface<ValueType>;
    predicate(predicateFunction: (value: ValueType) => boolean, errorMessage: string): this;
    getValue(): ValueType;
}

export interface TypedQueryParameterInterface<ValueType> {
    require(): this;
    defaultValue(value: ValueType): this;
    predicate(predicateFunction: (value: ValueType) => boolean, errorMessage: string): this;
    getValue(): ValueType;
}

export interface RawQueryParameterInterface {
    asNumber(): TypedQueryParameterInterface<number>;
    asDate(): TypedQueryParameterInterface<Date>;
    asString(): TypedQueryParameterInterface<string>;
    asBoolean(): TypedQueryParameterInterface<boolean>;
}

export class BaseQueryParameter {
    constructor(protected parameterName: string) { }

    protected makeError(message: string) {
        return new ParameterParserError(`Error parsing parameter ${this.parameterName}: ${message}`);
    }
}

export class RawQueryParameter extends BaseQueryParameter implements RawQueryParameterInterface {
    constructor(parameterName: string, private value: string) {
        super(parameterName);

        if (value === undefined) {
            throw new Error("Value cannot be undefined");
        }
    }

    asNumber() {
        let numberValue = Number(this.value);
        if (isFinite(numberValue)) {
            return this.createTypedQueryParameter(numberValue);
        } else {
            throw this.makeError(`Cannot parse value ${this.value} as number`);
        }
    }

    asDate() {
        let dateValue = new Date(this.value);
        if (isFinite(dateValue.valueOf())) {
            return this.createTypedQueryParameter(dateValue);
        } else {
            throw this.makeError(`Cannot parse value ${this.value} as Date`);
        }
    }

    asString() {
        return this.createTypedQueryParameter(this.value);
    }

    asBoolean() {
        let value = this.value.toLowerCase();
        
        if (value === 'true') {
            return this.createTypedQueryParameter(true);
        } else if (value === 'false') {
            return this.createTypedQueryParameter(false);
        } else {
            throw this.makeError(`Cannot parse string ${value} as boolean`);
        }
    }
    
    private createTypedQueryParameter<ValueType>(value: ValueType) {
        return new TypedQueryParameter(this.parameterName, value);
    }
}

export class UndefinedQueryParameter<ValueType> extends BaseQueryParameter implements QueryParameterInterface<ValueType> {
    constructor(parameterName: string) {
        super(parameterName);
    }

    require(): this {
        throw this.makeError("Required parameter is missing") as any;
    }

    asNumber() {
        return new UndefinedQueryParameter<number>(this.parameterName);
    }

    asDate() {
        return new UndefinedQueryParameter<Date>(this.parameterName);
    }

    asString() {
        return new UndefinedQueryParameter<string>(this.parameterName);
    }

    /*toStringList() {
        return new UndefinedQueryParameter<string[]>(this.parameterName);
    }*/

    asBoolean() {
        return new UndefinedQueryParameter<boolean>(this.parameterName);
    }

    defaultValue(value: ValueType) {
        return new QueryParameter(value, this.parameterName);
    }

    predicate(predicateFunction: (value: ValueType) => boolean, errorMessage: string) {
        return this;
    }

    getValue(): ValueType {
        return undefined;
    }
}

export class QueryParameter<ValueType> extends BaseQueryParameter implements QueryParameterInterface<ValueType> {
    constructor(private value: ValueType, parameterName: string) {
        super(parameterName);

        if (value === undefined) {
            throw new Error("Value cannot be undefined");
        }
    }

    require() {
        return this;
    }

    asNumber() {
        let numberValue = Number(this.value as any);
        if (isFinite(numberValue)) {
            return this.changeValueType(numberValue);
        } else {
            throw this.makeError(`Cannot parse value ${this.value} as number`);
        }
    }

    asDate() {
        let dateValue = new Date(this.value as any);
        if (isFinite(dateValue.valueOf())) {
            return this.changeValueType(dateValue);
        } else {
            throw this.makeError(`Cannot parse value ${this.value} as Date`);
        }
    }

    asString() {
        let stringValue = this.value as any;
        if (typeof stringValue === 'string') {
            return this.changeValueType(stringValue);
        } else {
            throw this.makeError(`Cannot parse value ${this.value} as string`);
        }
    }

    /*toStringList() {
        let value = this.value as any;
        if (typeof value === 'string') {
            return this.changeValueType([value]);
        } else if (value instanceof Array) {
            return this.changeValueType(value as string[]);
        } else {
            throw this.makeError(`Cannot parse value ${this.value} as array of strings`);
        }
    }*/

    asBoolean() {
        let value = this.value as any;
        if (typeof value === 'boolean') {
            return this.changeValueType(value);
        } else if (typeof value !== 'string') {
            throw this.makeError(`Cannot parse value of type ${typeof value} as boolean`);
        } else if (value.toLowerCase() === 'true') {
            return this.changeValueType(true);
        } else if (value.toLowerCase() === 'false') {
            return this.changeValueType(false);
        } else {
            throw this.makeError(`Cannot parse string ${value} as boolean`);
        }
    }

    defaultValue(value: ValueType) {
        return this;
    }

    predicate(predicateFunction: (value: ValueType) => boolean, errorMessage: string) {
        if (predicateFunction(this.value)) {
            return this;
        } else {
            throw this.makeError(errorMessage);
        }
    }

    getValue(): ValueType {
        return this.value;
    }

    private changeValueType<NewValueType>(value: NewValueType) {
        return new QueryParameter(value, this.parameterName);
    }
}

export class TypedQueryParameter<ValueType> extends BaseQueryParameter implements TypedQueryParameterInterface<ValueType> {
    constructor(parameterName: string, private value: ValueType) {
        super(parameterName);

        if (value === undefined) {
            throw new Error("Value cannot be undefined");
        }
    }

    require() {
        return this;
    }

    defaultValue(value: ValueType) {
        return this;
    }

    predicate(predicateFunction: (value: ValueType) => boolean, errorMessage: string) {
        if (predicateFunction(this.value)) {
            return this;
        } else {
            throw this.makeError(errorMessage);
        }
    }

    getValue(): ValueType {
        return this.value;
    }
}

export function createParameterParser(queryParams: any, parameterName: string): RawQueryParameterInterface {
    let value = queryParams[parameterName];
    if (value === undefined) {
        return new UndefinedQueryParameter(parameterName);
    } else if (typeof value === 'string') {
        return new RawQueryParameter(parameterName, value);
    } else {
        throw new Error("Raw value must be either undefined or of type string");
    }
}

export class QueryParser {
    private parsedParameters = new Set<string>();

    constructor(
        private queryParams: any
    ) {
    }

    parse(parameterName: string) {
        this.parsedParameters.add(parameterName);
        return createParameterParser(this.queryParams, parameterName);
    }
}
