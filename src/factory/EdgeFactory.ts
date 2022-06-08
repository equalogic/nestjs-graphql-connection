import { Cursor, CursorParameters } from '../cursor';
import { EdgeInterface } from '../type';

export interface EdgeFactoryInterface<
  TNode,
  TEdge extends EdgeInterface<TNode>,
  TCursorParams extends CursorParameters = CursorParameters,
  TCursor extends Cursor<TCursorParams> = Cursor<TCursorParams>,
> {
  createEdge(node: TNode, offset: number): TEdge;

  createCursor(node: TNode, offset: number): TCursor;

  decodeCursor?(encodedString: string): TCursor;
}
