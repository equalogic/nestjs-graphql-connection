import { Cursor } from '../cursor';
import { ConnectionArgsValidationError } from '../error';
import { ConnectionArgs, ConnectionInterface, EdgeInterface, PageInfo } from '../type';

export interface ConnectionBuilderOptions {
  defaultEdgesPerPage?: number;
  maxEdgesPerPage?: number;
  allowReverseOrder?: boolean;
}

export abstract class ConnectionBuilder<
  TConnection extends ConnectionInterface<TNode>,
  TEdge extends EdgeInterface<TNode>,
  TNode,
  TCursor extends Cursor = Cursor,
> {
  public edgesPerPage: number;
  public beforeCursor?: TCursor;
  public afterCursor?: TCursor;

  public constructor(
    { page, first, last, before, after }: ConnectionArgs,
    { defaultEdgesPerPage = 20, maxEdgesPerPage = 100, allowReverseOrder = true }: ConnectionBuilderOptions = {},
  ) {
    this.edgesPerPage = defaultEdgesPerPage;

    if (page != null) {
      throw new ConnectionArgsValidationError('This connection does not support the "page" argument for pagination.');
    }

    if (first != null) {
      if (first > maxEdgesPerPage || first < 1) {
        throw new ConnectionArgsValidationError(
          `The "first" argument accepts a value between 1 and ${maxEdgesPerPage}, inclusive.`,
        );
      }

      this.edgesPerPage = first;
    }

    if (last != null) {
      if (first != null) {
        throw new ConnectionArgsValidationError(
          'It is not permitted to specify both "first" and "last" arguments simultaneously.',
        );
      }

      if (!allowReverseOrder) {
        throw new ConnectionArgsValidationError('This connection does not support the "last" argument for pagination.');
      }

      if (last > maxEdgesPerPage || last < 1) {
        throw new ConnectionArgsValidationError(
          `The "last" argument accepts a value between 1 and ${maxEdgesPerPage}, inclusive.`,
        );
      }

      this.edgesPerPage = last;
    }

    if (after != null) {
      if (before != null) {
        throw new ConnectionArgsValidationError(
          'It is not permitted to specify both "after" and "before" arguments simultaneously.',
        );
      }
    }

    this.beforeCursor = before != null ? this.decodeCursor(before) : undefined;
    this.afterCursor = after != null ? this.decodeCursor(after) : undefined;
  }

  public abstract createConnection(fields: { edges: TEdge[]; pageInfo: PageInfo }): TConnection;

  public abstract createEdge(fields: { node: TNode; cursor: string }): TEdge;

  public abstract createCursor(node: TNode, offset: number): TCursor;

  public decodeCursor(encodedString: string): TCursor {
    return Cursor.fromString(encodedString) as TCursor;
  }

  public createPageInfo({
    edges,
    hasNextPage,
    hasPreviousPage,
    totalEdges,
  }: {
    edges: TEdge[];
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    totalEdges?: number;
  }): PageInfo {
    return {
      startCursor: edges.length > 0 ? edges[0].cursor : null,
      endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
      hasNextPage,
      hasPreviousPage,
      totalEdges,
    };
  }

  public build({
    nodes,
    totalEdges,
    hasNextPage,
    hasPreviousPage,
    createConnection = this.createConnection,
    createEdge = this.createEdge,
    createCursor = this.createCursor,
  }: {
    nodes: TNode[];
    totalEdges?: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
    createConnection?: (fields: { edges: TEdge[]; pageInfo: PageInfo }) => TConnection;
    createEdge?: (fields: { node: TNode; cursor: string }) => TEdge;
    createCursor?: (node: TNode, offset: number) => TCursor;
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
        hasNextPage: hasNextPage ?? (totalEdges != null && totalEdges > edges.length),
        hasPreviousPage: hasPreviousPage ?? (this.afterCursor != null || this.beforeCursor != null),
      }),
    });
  }
}
