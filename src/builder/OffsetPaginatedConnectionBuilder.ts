import { OffsetCursor } from '../cursor';
import { ConnectionArgsValidationError } from '../error';
import { ConnectionArgs, ConnectionInterface, EdgeInterface, PageInfo } from '../type';
import { ConnectionBuilder, ConnectionBuilderOptions } from './ConnectionBuilder';

export abstract class OffsetPaginatedConnectionBuilder<
  TConnection extends ConnectionInterface<TNode>,
  TEdge extends EdgeInterface<TNode>,
  TNode,
> extends ConnectionBuilder<TConnection, TEdge, TNode, OffsetCursor> {
  public startOffset: number;

  public createCursor(node: TNode, index: number): OffsetCursor {
    return new OffsetCursor({ offset: this.startOffset + index });
  }

  public decodeCursor(encodedString: string): OffsetCursor {
    return OffsetCursor.fromString(encodedString);
  }

  public build({
    nodes,
    totalEdges,
    hasNextPage,
    hasPreviousPage,
    createConnection = this.createConnection.bind(this),
    createEdge = this.createEdge.bind(this),
    createCursor = this.createCursor.bind(this),
  }: {
    nodes: TNode[];
    totalEdges?: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
    createConnection?: (fields: { edges: TEdge[]; pageInfo: PageInfo }) => TConnection;
    createEdge?: (fields: { node: TNode; cursor: string }) => TEdge;
    createCursor?: (node: TNode, index: number) => OffsetCursor;
  }): TConnection {
    const edges = nodes.map((node, index) =>
      createEdge({
        node,
        cursor: createCursor(node, index).encode(),
      }),
    );

    return createConnection({
      edges,
      pageInfo: this.createPageInfo({
        edges,
        totalEdges,
        hasNextPage: hasNextPage ?? (totalEdges != null && totalEdges > this.startOffset + edges.length),
        hasPreviousPage: hasPreviousPage ?? this.startOffset > 0,
      }),
    });
  }

  protected applyConnectionArgs(
    { page, first, last, before, after }: ConnectionArgs,
    { defaultEdgesPerPage, maxEdgesPerPage = 100 }: ConnectionBuilderOptions = {},
  ): void {
    this.edgesPerPage = defaultEdgesPerPage ?? this.edgesPerPage;
    this.startOffset = 0;

    if (first != null) {
      if (first > maxEdgesPerPage || first < 1) {
        throw new ConnectionArgsValidationError(
          `The "first" argument accepts a value between 1 and ${maxEdgesPerPage}, inclusive.`,
        );
      }

      this.edgesPerPage = first;
      this.startOffset = 0;
    }

    if (page != null) {
      if (after != null) {
        throw new ConnectionArgsValidationError(`The "page" argument cannot be used together with "after".`);
      }

      if (page < 1) {
        throw new ConnectionArgsValidationError(
          `The "page" argument accepts only a positive integer greater than zero.`,
        );
      }

      this.startOffset = this.edgesPerPage * (page - 1);
    }

    if (after != null) {
      this.afterCursor = this.decodeCursor(after);
      this.startOffset = this.afterCursor.parameters.offset + 1;
    }

    if (last != null) {
      throw new ConnectionArgsValidationError('This connection does not support the "last" argument for pagination.');
    }

    if (before != null) {
      throw new ConnectionArgsValidationError('This connection does not support the "before" argument for pagination.');
    }
  }
}
