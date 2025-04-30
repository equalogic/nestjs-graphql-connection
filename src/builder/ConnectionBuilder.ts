import { Cursor } from '../cursor';
import { ConnectionArgsValidationError } from '../error';
import { ConnectionArgs, ConnectionInterface, EdgeInterface, PageInfo } from '../type';

export interface ConnectionBuilderOptions {
  defaultEdgesPerPage?: number;
  maxEdgesPerPage?: number;
  allowReverseOrder?: boolean;
}

export type EdgeExtraFields<TEdge extends EdgeInterface<TNode>, TNode = any> = Partial<Omit<TEdge, 'node' | 'cursor'>>;

export type EdgeInput<TEdge extends EdgeInterface<TNode>, TNode = any> = {
  node: TNode;
  cursor?: string;
} & EdgeExtraFields<TEdge>;

export type EdgeInputWithCursor<TEdge extends EdgeInterface<TNode>, TNode = any> = {
  node: TNode;
  cursor: string;
} & EdgeExtraFields<TEdge>;

export interface CommonBuildParams<
  TNode,
  TEdge extends EdgeInterface<TNode>,
  TConnection extends ConnectionInterface<TEdge>,
  TCursor extends Cursor = Cursor,
> {
  totalEdges?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  createConnection?: (fields: { edges: TEdge[]; pageInfo: PageInfo }) => TConnection;
  createEdge?: (fields: EdgeInputWithCursor<TEdge>) => TEdge;
  createCursor?: (node: TNode, index: number) => TCursor;
}

export type BuildFromNodesParams<
  TNode,
  TEdge extends EdgeInterface<TNode>,
  TConnection extends ConnectionInterface<TEdge>,
  TCursor extends Cursor = Cursor,
> = {
  nodes?: TNode[];
  edges?: never;
} & CommonBuildParams<TNode, TEdge, TConnection, TCursor>;

export type BuildFromEdgesParams<
  TNode,
  TEdge extends EdgeInterface<TNode>,
  TConnection extends ConnectionInterface<TEdge>,
  TCursor extends Cursor = Cursor,
> = {
  nodes?: never;
  edges?: EdgeInput<TEdge>[];
} & CommonBuildParams<TNode, TEdge, TConnection, TCursor>;

export abstract class ConnectionBuilder<
  TConnection extends ConnectionInterface<TEdge>,
  TConnectionArgs extends ConnectionArgs,
  TEdge extends EdgeInterface<TNode>,
  TNode,
  TCursor extends Cursor = Cursor,
> {
  public connectionArgs: TConnectionArgs;
  public edgesPerPage: number = 20;
  public beforeCursor?: TCursor;
  public afterCursor?: TCursor;

  public constructor(connectionArgs: TConnectionArgs, options: ConnectionBuilderOptions = {}) {
    this.connectionArgs = connectionArgs;

    this.applyConnectionArgs(connectionArgs, options);
  }

  public abstract createConnection(fields: { edges: TEdge[]; pageInfo: PageInfo }): TConnection;

  public abstract createEdge(fields: EdgeInputWithCursor<TEdge>): TEdge;

  public abstract createCursor(node: TNode, index: number): TCursor;

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
    edges,
    totalEdges,
    hasNextPage,
    hasPreviousPage,
    createConnection = this.createConnection,
    createEdge = this.createEdge,
    createCursor = this.createCursor,
  }:
    | BuildFromNodesParams<TNode, TEdge, TConnection, TCursor>
    | BuildFromEdgesParams<TNode, TEdge, TConnection, TCursor>): TConnection {
    const resolvedEdges: TEdge[] =
      edges != null
        ? edges.map((edge, index) =>
            createEdge.bind(this)({
              cursor: edge.cursor ?? createCursor.bind(this)(edge.node, index).encode(),
              ...edge,
            }),
          )
        : nodes!.map((node, index) =>
            createEdge.bind(this)({
              node,
              cursor: createCursor.bind(this)(node, index).encode(),
            }),
          );

    return createConnection.bind(this)({
      edges: resolvedEdges,
      pageInfo: this.createPageInfo({
        edges: resolvedEdges,
        totalEdges,
        hasNextPage: hasNextPage ?? (totalEdges != null && totalEdges > resolvedEdges.length),
        hasPreviousPage: hasPreviousPage ?? (this.afterCursor != null || this.beforeCursor != null),
      }),
    });
  }

  protected applyConnectionArgs(
    { page, first, last, before, after }: ConnectionArgs,
    { defaultEdgesPerPage, maxEdgesPerPage = 100, allowReverseOrder = true }: ConnectionBuilderOptions = {},
  ): void {
    this.edgesPerPage = defaultEdgesPerPage ?? this.edgesPerPage;

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
}
