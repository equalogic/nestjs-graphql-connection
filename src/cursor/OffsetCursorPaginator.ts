import { ConnectionArgsValidationError } from '../error';
import {
  ConnectionArgs,
  ConnectionFactoryFunction,
  ConnectionInterface,
  CursorDecoderFunction,
  CursorFactoryFunction,
  EdgeFactoryFunction,
  EdgeInterface,
  PageInfo,
} from '../type';
import { OffsetCursor } from './OffsetCursor';

interface CreateFromConnectionArgsOptions {
  defaultEdgesPerPage?: number;
  maxEdgesPerPage?: number;
}

const defaultOffsetCursorDecoder: CursorDecoderFunction<OffsetCursor> = params => OffsetCursor.fromString(params);

export class OffsetCursorPaginator<
  TConnection extends ConnectionInterface<TNode>,
  TEdge extends EdgeInterface<TNode>,
  TNode = any,
> {
  public connectionFactory: ConnectionFactoryFunction<TConnection, TNode>;
  public edgeFactory: EdgeFactoryFunction<TEdge, TNode>;
  public cursorFactory: CursorFactoryFunction<TNode, OffsetCursor>;
  public cursorDecoder: CursorDecoderFunction<OffsetCursor>;
  public edgesPerPage: number = 20;
  public totalEdges?: number;
  public startOffset: number = 0;

  constructor({
    createConnection,
    createEdge,
    createCursor,
    decodeCursor,
    edgesPerPage,
    totalEdges,
    startOffset,
  }: {
    createConnection: ConnectionFactoryFunction<TConnection, TNode>;
    createEdge: EdgeFactoryFunction<TEdge, TNode>;
    createCursor?: CursorFactoryFunction<TNode, OffsetCursor>;
    decodeCursor?: CursorDecoderFunction<OffsetCursor>;
  } & Pick<OffsetCursorPaginator<TConnection, TEdge, TNode>, 'edgesPerPage' | 'totalEdges' | 'startOffset'>) {
    this.connectionFactory = createConnection;
    this.edgeFactory = createEdge;
    this.cursorFactory = createCursor ?? ((node, offset) => new OffsetCursor({ offset }));
    this.cursorDecoder = decodeCursor ?? defaultOffsetCursorDecoder;
    this.edgesPerPage = edgesPerPage;
    this.totalEdges = totalEdges;
    this.startOffset = startOffset;
  }

  public createEdges(nodes: TNode[]): TEdge[] {
    return nodes.map((node, index) =>
      this.edgeFactory({
        node,
        cursor: this.cursorFactory(node, this.startOffset + index).encode(),
      }),
    );
  }

  public createPageInfo({ edges, hasMore }: { edges: TEdge[]; hasMore?: boolean }): PageInfo {
    return {
      startCursor: edges.length > 0 ? edges[0].cursor : null,
      endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
      hasNextPage: hasMore ?? (this.totalEdges != null && this.startOffset + edges.length < this.totalEdges),
      hasPreviousPage: this.startOffset > 0,
      totalEdges: this.totalEdges,
    };
  }

  public static createFromConnectionArgs<
    TConnection extends ConnectionInterface<TNode>,
    TEdge extends EdgeInterface<TNode>,
    TNode = any,
  >({
    createConnection,
    createEdge,
    createCursor,
    decodeCursor = defaultOffsetCursorDecoder,
    totalEdges,
    page,
    first,
    last,
    before,
    after,
    defaultEdgesPerPage = 20,
    maxEdgesPerPage = 100,
  }: Pick<OffsetCursorPaginator<TConnection, TEdge, TNode>, 'totalEdges'> & {
    createConnection: ConnectionFactoryFunction<TConnection, TNode>;
    createEdge: EdgeFactoryFunction<TEdge, TNode>;
    createCursor?: CursorFactoryFunction<TNode, OffsetCursor>;
    decodeCursor?: CursorDecoderFunction<OffsetCursor>;
  } & ConnectionArgs &
    CreateFromConnectionArgsOptions): OffsetCursorPaginator<TConnection, TEdge, TNode> {
    let edgesPerPage: number = defaultEdgesPerPage;
    let startOffset: number = 0;

    if (first != null) {
      if (first > maxEdgesPerPage || first < 1) {
        throw new ConnectionArgsValidationError(
          `The "first" argument accepts a value between 1 and ${maxEdgesPerPage}, inclusive.`,
        );
      }

      edgesPerPage = first;
      startOffset = 0;
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

      startOffset = edgesPerPage * (page - 1);
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
      startOffset = totalEdges != null && totalEdges > last ? totalEdges - last : 0;
    }

    if (after != null) {
      if (last != null) {
        throw new ConnectionArgsValidationError(
          'It is not permitted to specify both "last" and "after" arguments simultaneously.',
        );
      }

      startOffset = decodeCursor(after).parameters.offset + 1;
    }

    if (before != null) {
      throw new ConnectionArgsValidationError('This connection does not support the "before" argument for pagination.');
    }

    return new OffsetCursorPaginator<TConnection, TEdge, TNode>({
      createConnection,
      createEdge,
      createCursor,
      decodeCursor,
      edgesPerPage,
      totalEdges,
      startOffset,
    });
  }
}
