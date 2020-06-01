import Joi from 'joi';
import { ConnectionArgs, PageInfo } from '../type';
import { Cursor } from './Cursor';
import { ConnectionArgsValidationError, CursorValidationError } from '../error';

export class OffsetCursor extends Cursor {
  public parameters: {
    offset: number;
  };

  public static create(encodedString: string): OffsetCursor {
    const parameters = Cursor.decode(encodedString);

    // validate the cursor parameters match the schema we expect, this also converts data types
    const { error, value: validatedParameters } = Joi.validate(
      parameters,
      Joi.object({
        offset: Joi.number()
          .integer()
          .min(0)
          .empty('')
          .required(),
      }).unknown(false),
    );

    if (error != null) {
      const errorMessages =
        error.details != null ? error.details.map(detail => `- ${detail.message}`).join('\n') : `- ${error.message}`;

      throw new CursorValidationError(
        `A provided cursor value is not valid. The following problems were found:\n\n${errorMessages}`,
      );
    }

    return new OffsetCursor(validatedParameters);
  }
}

interface CreateFromConnectionArgsOptions {
  defaultEdgesPerPage?: number;
  maxEdgesPerPage?: number;
}

export class OffsetCursorPaginator {
  public take: number = 20;
  public skip: number = 0;
  public totalEdges: number = 0;

  constructor({ take, skip, totalEdges }: Pick<OffsetCursorPaginator, 'take' | 'skip' | 'totalEdges'>) {
    this.take = take;
    this.skip = skip;
    this.totalEdges = totalEdges;
  }

  public createPageInfo(edgesInPage: number): PageInfo {
    return {
      startCursor: edgesInPage > 0 ? this.createCursor(0).encode() : null,
      endCursor: edgesInPage > 0 ? this.createCursor(edgesInPage - 1).encode() : null,
      hasNextPage: this.skip + edgesInPage < this.totalEdges,
      hasPreviousPage: this.skip > 0,
      totalEdges: this.totalEdges,
    };
  }

  public createCursor(index: number): OffsetCursor {
    return new OffsetCursor({ offset: this.skip + index });
  }

  public static createFromConnectionArgs(
    { first, last, before, after }: ConnectionArgs,
    totalEdges: number,
    options: CreateFromConnectionArgsOptions = {},
  ): OffsetCursorPaginator {
    const { defaultEdgesPerPage = 20, maxEdgesPerPage = 100 } = options;
    let take: number = defaultEdgesPerPage;
    let skip: number = 0;

    if (first != null) {
      if (first > maxEdgesPerPage || first < 1) {
        throw new ConnectionArgsValidationError(
          `The "first" argument accepts a value between 1 and ${maxEdgesPerPage}, inclusive.`,
        );
      }

      take = first;
      skip = 0;
    }

    if (last != null) {
      if (first != null) {
        throw new ConnectionArgsValidationError(
          'It is not permitted to specify both "first" and "last" arguments simultaneously.',
        );
      }

      if (last > 100 || last < 1) {
        throw new ConnectionArgsValidationError(
          `The "last" argument accepts a value between 1 and ${maxEdgesPerPage}, inclusive.`,
        );
      }

      take = last;
      skip = totalEdges > last ? totalEdges - last : 0;
    }

    if (after != null) {
      if (last != null) {
        throw new ConnectionArgsValidationError(
          'It is not permitted to specify both "last" and "after" arguments simultaneously.',
        );
      }

      skip = OffsetCursor.create(after).parameters.offset + 1;
    }

    if (before != null) {
      throw new ConnectionArgsValidationError('This connection does not support the "before" argument for pagination.');
    }

    return new OffsetCursorPaginator({
      take,
      skip,
      totalEdges,
    });
  }
}
