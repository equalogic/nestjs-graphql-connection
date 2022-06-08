import queryString, { StringifiableRecord } from 'query-string';

export function decodeCursorString(encodedString: string): queryString.ParsedQuery {
  // opaque cursors are base64 encoded, decode it first
  const decodedString = Buffer.from(encodedString, 'base64').toString();

  // cursor string is URL encoded, parse it into a map of parameters
  return queryString.parse(decodedString);
}

export type CursorParameters = StringifiableRecord;

export interface CursorInterface<TParams extends CursorParameters = CursorParameters> {
  parameters: TParams;

  toString(): string;

  encode(): string;
}

export class Cursor<TParams extends CursorParameters = CursorParameters> implements CursorInterface<TParams> {
  constructor(public readonly parameters: TParams) {}

  public toString(): string {
    return queryString.stringify(this.parameters);
  }

  public encode(): string {
    return Buffer.from(this.toString()).toString('base64');
  }

  public static decode(encodedString: string): queryString.ParsedQuery {
    return decodeCursorString(encodedString);
  }

  public static fromString<TParams extends CursorParameters = CursorParameters>(
    encodedString: string,
    validateParams?: (params: unknown) => TParams,
  ): Cursor<TParams> {
    const parameters = Cursor.decode(encodedString);

    // run the cursor parameters through the validation function, if we have one
    const validatedParameters = validateParams != null ? validateParams(parameters) : (parameters as TParams);

    return new Cursor<TParams>(validatedParameters);
  }
}
