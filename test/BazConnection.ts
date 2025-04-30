import {
  ConnectionArgs,
  ConnectionInterface,
  createConnectionType,
  createEdgeType,
  EdgeInputWithCursor,
  EdgeInterface,
  OffsetPaginatedConnectionBuilder,
  PageInfo,
} from '../src';
import { Initializable } from 'ts-class-initializable';

export class Baz extends Initializable<Baz> {
  id: string;
  name: string;
}

export interface BazEdgeInterface extends EdgeInterface<Baz> {
  customEdgeField?: number;
}

export class BazEdge extends createEdgeType<BazEdgeInterface>(Baz) implements BazEdgeInterface {
  public customEdgeField?: number;
}

export interface BazConnectionInterface extends ConnectionInterface<BazEdge> {
  customConnectionField?: number;
}

export class BazConnection
  extends createConnectionType<BazConnectionInterface>(BazEdge)
  implements BazConnectionInterface
{
  public customConnectionField?: number;
}

export class BazConnectionArgs extends ConnectionArgs {
  public sortOption?: string;
}

export class BazConnectionBuilder extends OffsetPaginatedConnectionBuilder<
  BazConnection,
  BazConnectionArgs,
  BazEdge,
  Baz
> {
  public createConnection(fields: { edges: BazEdge[]; pageInfo: PageInfo }): BazConnection {
    return new BazConnection(fields);
  }

  public createEdge(fields: EdgeInputWithCursor<BazEdge>): BazEdge {
    return new BazEdge(fields);
  }
}
