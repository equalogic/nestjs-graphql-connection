import { EdgeFactoryInterface } from '../factory';
import { ConnectionArgs, EdgeInterface, PageInfo } from '../type';
import { Cursor, CursorParameters } from './Cursor';
import { ConnectionArgsValidationError } from '../error';

interface CreateFromConnectionArgsOptions {
  defaultEdgesPerPage?: number;
  maxEdgesPerPage?: number;
  allowReverseOrder?: boolean;
}

export class CursorPaginator<
  TEdge extends EdgeInterface<TNode>,
  TParams extends CursorParameters = CursorParameters,
  TNode = any,
> {
  public edgeFactory: EdgeFactoryInterface<TNode, TEdge, TParams, Cursor<TParams>>;
  public edgesPerPage: number = 20;
  public totalEdges?: number;
  public afterCursor?: Cursor<TParams>;
  public beforeCursor?: Cursor<TParams>;

  constructor({
    edgeFactory,
    edgesPerPage,
    totalEdges,
    afterCursor,
    beforeCursor,
  }: Pick<
    CursorPaginator<TEdge, TParams, TNode>,
    'edgeFactory' | 'edgesPerPage' | 'totalEdges' | 'afterCursor' | 'beforeCursor'
  >) {
    this.edgeFactory = edgeFactory;
    this.edgesPerPage = edgesPerPage;
    this.totalEdges = totalEdges;
    this.afterCursor = afterCursor;
    this.beforeCursor = beforeCursor;
  }

  public createEdges(nodes: TNode[]): TEdge[] {
    return nodes.map((node, index) => this.edgeFactory.createEdge(node, index));
  }

  public createPageInfo({ edges, hasMore }: { edges: TEdge[]; hasMore?: boolean }): PageInfo {
    return {
      startCursor: edges.length > 0 ? edges[0].cursor : null,
      endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
      hasNextPage: hasMore ?? (this.totalEdges != null && this.totalEdges > edges.length),
      hasPreviousPage: this.afterCursor != null || this.beforeCursor != null,
      totalEdges: this.totalEdges,
    };
  }

  public static createFromConnectionArgs<
    TEdge extends EdgeInterface<TNode>,
    TParams extends CursorParameters = CursorParameters,
    TNode = any,
  >({
    edgeFactory,
    totalEdges,
    page,
    first,
    last,
    before,
    after,
    defaultEdgesPerPage = 20,
    maxEdgesPerPage = 100,
    allowReverseOrder = true,
  }: Pick<CursorPaginator<TEdge, TParams, TNode>, 'edgeFactory' | 'totalEdges'> &
    ConnectionArgs &
    CreateFromConnectionArgsOptions): CursorPaginator<TEdge, TParams, TNode> {
    const decodeCursor = edgeFactory.decodeCursor ?? (params => Cursor.fromString<TParams>(params));

    let edgesPerPage: number = defaultEdgesPerPage;

    if (page != null) {
      throw new ConnectionArgsValidationError('This connection does not support the "page" argument for pagination.');
    }

    if (first != null) {
      if (first > maxEdgesPerPage || first < 1) {
        throw new ConnectionArgsValidationError(
          `The "first" argument accepts a value between 1 and ${maxEdgesPerPage}, inclusive.`,
        );
      }

      edgesPerPage = first;
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

      edgesPerPage = last;
    }

    if (after != null) {
      if (before != null) {
        throw new ConnectionArgsValidationError(
          'It is not permitted to specify both "after" and "before" arguments simultaneously.',
        );
      }
    }

    return new CursorPaginator<TEdge, TParams, TNode>({
      edgeFactory,
      edgesPerPage,
      totalEdges,
      beforeCursor: before != null ? decodeCursor(before) : undefined,
      afterCursor: after != null ? decodeCursor(after) : undefined,
    });
  }
}
