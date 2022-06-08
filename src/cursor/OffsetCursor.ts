import Joi from 'joi';
import queryString from 'query-string';
import { CursorInterface, decodeCursorString } from './Cursor';
import { validateCursorParameters } from './validateCursorParameters';

export type OffsetCursorParameters = {
  offset: number;
};
const offsetCursorSchema = Joi.object<OffsetCursorParameters>({
  offset: Joi.number().integer().min(0).empty('').required(),
}).unknown(false);

export class OffsetCursor implements CursorInterface<OffsetCursorParameters> {
  constructor(public readonly parameters: OffsetCursorParameters) {}

  public toString(): string {
    return queryString.stringify(this.parameters);
  }

  public encode(): string {
    return Buffer.from(this.toString()).toString('base64');
  }

  public static decode(encodedString: string): queryString.ParsedQuery {
    return decodeCursorString(encodedString);
  }

  public static fromString(encodedString: string): OffsetCursor {
    const parameters = OffsetCursor.decode(encodedString);

    return new OffsetCursor(validateCursorParameters(parameters, offsetCursorSchema));
  }

  /**
   * @deprecated
   */
  public static create(encodedString: string): OffsetCursor {
    return OffsetCursor.fromString(encodedString);
  }
}
