import { OffsetCursor } from '../cursor';
import { ConnectionArgsValidationError } from '../error';
import { ConnectionArgs, ConnectionInterface, EdgeInterface } from '../type';
import {
  BuildFromEdgesParams,
  BuildFromNodesParams,
  ConnectionBuilder,
  ConnectionBuilderOptions,
} from './ConnectionBuilder';

export abstract class OffsetPaginatedConnectionBuilder<
  TConnection extends ConnectionInterface<TEdge>,
  TConnectionArgs extends ConnectionArgs,
  TEdge extends EdgeInterface<TNode>,
  TNode,
> extends ConnectionBuilder<TConnection, TConnectionArgs, TEdge, TNode, OffsetCursor> {
  public startOffset: number;

  public createCursor(node: TNode, index: number): OffsetCursor {
    return new OffsetCursor({ offset: this.startOffset + index });
  }

  public decodeCursor(encodedString: string): OffsetCursor {
    return OffsetCursor.fromString(encodedString);
  }

  public build({
    nodes,
    edges,
    totalEdges,
    hasNextPage,
    hasPreviousPage,
    createConnection = this.createConnection.bind(this),
    createEdge = this.createEdge.bind(this),
    createCursor = this.createCursor.bind(this),
  }:
    | BuildFromNodesParams<TNode, TEdge, TConnection, OffsetCursor>
    | BuildFromEdgesParams<TNode, TEdge, TConnection, OffsetCursor>): TConnection {
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
        hasNextPage: hasNextPage ?? (totalEdges != null && totalEdges > this.startOffset + resolvedEdges.length),
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
