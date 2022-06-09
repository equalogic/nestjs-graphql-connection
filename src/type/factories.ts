import { Cursor } from '../cursor';
import { ConnectionInterface } from './Connection';
import { EdgeInterface } from './Edge';
import { PageInfo } from './PageInfo';

export type ConnectionFactoryFunction<TConnection extends ConnectionInterface<TNode>, TNode> = (fields: {
  edges: EdgeInterface<TNode>[];
  pageInfo: PageInfo;
}) => TConnection;

export type EdgeFactoryFunction<TEdge extends EdgeInterface<TNode>, TNode> = (fields: {
  node: TNode;
  cursor: string;
}) => TEdge;

export type CursorFactoryFunction<TNode, TCursor extends Cursor = Cursor> = (node: TNode, offset: number) => TCursor;

export type CursorDecoderFunction<TCursor extends Cursor = Cursor> = (encodedString: string) => TCursor;
