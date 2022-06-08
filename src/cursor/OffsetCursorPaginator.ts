import { ConnectionArgsValidationError } from '../error';
import { ConnectionArgs, PageInfo } from '../type';
import { OffsetCursor } from './OffsetCursor';

interface CreateFromConnectionArgsOptions {
  defaultEdgesPerPage?: number;
  maxEdgesPerPage?: number;
}

export class OffsetCursorPaginator {
  public edgesPerPage: number = 20;
  public totalEdges: number = 0;
  public skip: number = 0;

  constructor({ edgesPerPage, totalEdges, skip }: Pick<OffsetCursorPaginator, 'edgesPerPage' | 'totalEdges' | 'skip'>) {
    this.edgesPerPage = edgesPerPage;
    this.totalEdges = totalEdges;
    this.skip = skip;
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
    let edgesPerPage: number = defaultEdgesPerPage;
    let skip: number = 0;

    if (first != null) {
      if (first > maxEdgesPerPage || first < 1) {
        throw new ConnectionArgsValidationError(
          `The "first" argument accepts a value between 1 and ${maxEdgesPerPage}, inclusive.`,
        );
      }

      edgesPerPage = first;
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

      skip = edgesPerPage * (page - 1);
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

      edgesPerPage = last;
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
      edgesPerPage,
      skip,
      totalEdges,
    });
  }
}
