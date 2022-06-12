import * as GQL from '@nestjs/graphql';
import { EdgeInterface } from './Edge';
import { PageInfo } from './PageInfo';

export interface ConnectionInterface<TEdge> {
  pageInfo: PageInfo;
  edges: TEdge[];
}

export function createConnectionType<TEdge extends EdgeInterface<any> = EdgeInterface<any>>(
  TEdgeClass: new (...args: any[]) => TEdge,
): new (fields?: Partial<ConnectionInterface<TEdge>>) => ConnectionInterface<TEdge> {
  // This class should be further extended by concrete Connection types. It can't be marked as
  // an abstract class because TS lacks support for returning `abstract new()...` as a type
  // (https://github.com/Microsoft/TypeScript/issues/25606)
  @GQL.ObjectType({ isAbstract: true })
  class Connection implements ConnectionInterface<TEdge> {
    @GQL.Field(_type => PageInfo)
    public pageInfo: PageInfo;

    @GQL.Field(_type => [TEdgeClass])
    public edges: TEdge[];

    constructor(fields?: Partial<ConnectionInterface<TNode>>) {
      if (fields != null) {
        if (fields.pageInfo != null) {
          this.pageInfo = fields.pageInfo;
        }

        if (fields.edges != null) {
          this.edges = fields.edges;
        }
      }
    }
  }

  return Connection;
}
