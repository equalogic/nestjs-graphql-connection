import Joi from 'joi';
import queryString from 'query-string';
import { ConnectionArgsValidationError, CursorValidationError } from '../error';
import { ConnectionArgs, PageInfo } from '../type';
import { Cursor, CursorInterface, decodeCursorString } from './Cursor';
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
    { page, first, last, before, after }: ConnectionArgs,
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

    if (page != null) {
      if (last != null || after != null || before != null) {
        throw new ConnectionArgsValidationError(
          `The "page" argument cannot be used together with "last", "after" or "before".`,
        );
      }

      if (page < 1) {
        throw new ConnectionArgsValidationError(
          `The "page" argument accepts only a positive integer greater than zero.`,
        );
      }

      skip = take * (page - 1);
    }

    if (last != null) {
      if (first != null) {
        throw new ConnectionArgsValidationError(
          'It is not permitted to specify both "first" and "last" arguments simultaneously.',
        );
      }

      if (last > maxEdgesPerPage || last < 1) {
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

      skip = OffsetCursor.fromString(after).parameters.offset + 1;
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
