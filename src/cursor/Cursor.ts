import Joi from 'joi';
import queryString, { StringifiableRecord } from 'query-string';

export type CursorParameters = StringifiableRecord;

export class Cursor<P = CursorParameters> {
  constructor(public readonly parameters: P) {}

  public toString(): string {
    return queryString.stringify(this.parameters);
  }

  public encode(): string {
    return Buffer.from(this.toString()).toString('base64');
  }

  public static decode(encodedString: string): queryString.ParsedQuery {
    // opaque cursors are base64 encoded, decode it first
    const decodedString = Buffer.from(encodedString, 'base64').toString();

    // cursor string is URL encoded, parse it into a map of parameters
    return queryString.parse(decodedString);
  }

  public static create(encodedString: string, schema: Joi.ObjectSchema): Cursor {
    const parameters = Cursor.decode(encodedString);

    // validate the cursor parameters match the schema we expect, this also converts data types
    const { error, value: validatedParameters } = schema.validate(parameters);

    if (error != null) {
      throw error;
    }

    return new Cursor(validatedParameters);
  }
}
