import * as GQL from 'type-graphql';
import * as Relay from 'graphql-relay';
import { EdgeInterface } from './Edge';
import { PageInfo } from './PageInfo';

export interface ConnectionInterface<TNode> extends Relay.Connection<TNode> {
  pageInfo: PageInfo;
  edges: EdgeInterface<TNode>[];
}

export function createConnectionType<TNode>(
  TEdgeClass: new (fields?: Partial<EdgeInterface<TNode>>) => EdgeInterface<TNode>,
): new (fields?: Partial<ConnectionInterface<TNode>>) => ConnectionInterface<TNode> {
  // This class should be further extended by concrete Connection types. It can't be marked as
  // an abstract class because TS lacks support for returning `abstract new()...` as a type
  // (https://github.com/Microsoft/TypeScript/issues/25606)
  @GQL.ObjectType({ isAbstract: true })
  class Connection implements ConnectionInterface<TNode> {
    @GQL.Field(_type => PageInfo)
    public pageInfo: PageInfo;

    @GQL.Field(_type => [TEdgeClass])
    public edges: EdgeInterface<TNode>[];

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
