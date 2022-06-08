import Joi from 'joi';
import { CursorValidationError } from '../error';
import { CursorParameters } from './Cursor';

export function validateCursorParameters<TParams = CursorParameters>(
  parameters: unknown,
  schema: Joi.ObjectSchema<TParams>,
): TParams {
  const { error, value: validatedParameters } = schema.validate(parameters);

  if (error != null) {
    const errorMessages =
      error.details != null ? error.details.map(detail => `- ${detail.message}`).join('\n') : `- ${error.message}`;

    throw new CursorValidationError(
      `A provided cursor value is not valid. The following problems were found:\n\n${errorMessages}`,
    );
  }

  return validatedParameters!;
}
