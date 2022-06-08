import { Cursor, CursorParameters } from '../cursor';
import { EdgeInterface } from './Edge';

export interface EdgeFactoryInterface<
  TNode,
  TEdge extends EdgeInterface<TNode>,
  TCursorParams extends CursorParameters = CursorParameters,
  TCursor extends Cursor<TCursorParams> = Cursor<TCursorParams>,
> {
  createEdge(node: TNode): TEdge;

  createCursor(node: TNode): TCursor;

  decodeCursor?(encodedString: string): TCursor;
}
