import * as querystring from 'querystring';
import Joi from 'joi';

export class Cursor {
  constructor(public readonly parameters: querystring.ParsedUrlQueryInput) {}

  public toString(): string {
    return querystring.stringify(this.parameters, '&', '=');
  }

  public encode(): string {
    return Buffer.from(this.toString()).toString('base64');
  }

  public static decode(encodedString: string): querystring.ParsedUrlQuery {
    // opaque cursors are base64 encoded, decode it first
    const decodedString = Buffer.from(encodedString, 'base64').toString();

    // cursor string is URL encoded, parse it into a map of parameters
    return querystring.parse(decodedString, '&', '=', {
      maxKeys: 20,
    });
  }

  public static create(encodedString: string, schema: Joi.ObjectSchema): Cursor {
    // opaque cursors are base64 encoded, decode it first
    const decodedString = Buffer.from(encodedString, 'base64').toString();

    // cursor string is URL encoded, parse it into a map of parameters
    const parameters = querystring.parse(decodedString, '&', '=', {
      maxKeys: 20,
    });

    // validate the cursor parameters match the schema we expect, this also converts data types
    const { error, value: validatedParameters } = Joi.validate(parameters, schema);

    if (error != null) {
      throw error;
    }

    return new Cursor(validatedParameters);
  }
}
