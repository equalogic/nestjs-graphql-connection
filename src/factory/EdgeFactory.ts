import { Cursor, CursorParameters } from '../cursor';
import { EdgeInterface } from '../type';

export interface EdgeFactoryInterface<TEdge extends EdgeInterface<TNode>, TNode, TCursor extends Cursor = Cursor> {
  createEdge(node: TNode, offset: number): TEdge;

  createCursor(node: TNode, offset: number): TCursor;

  decodeCursor?(encodedString: string): TCursor;
}
