import * as Relay from 'graphql-relay';
import * as GQL from '@nestjs/graphql';

export interface EdgeInterface<TNode> extends Relay.Edge<TNode> {
  node: TNode;
  cursor: string;
}

export function createEdgeType<TNode>(
  TNodeClass: new () => TNode,
): new (fields?: Partial<EdgeInterface<TNode>>) => EdgeInterface<TNode> {
  // This class should be further extended by concrete Edge types. It can't be marked as
  // an abstract class because TS lacks support for returning `abstract new()...` as a type
  // (https://github.com/Microsoft/TypeScript/issues/25606)
  @GQL.ObjectType({ isAbstract: true })
  class Edge implements EdgeInterface<TNode> {
    @GQL.Field(_type => TNodeClass, {
      description: `The node object (belonging to type ${TNodeClass.name}) attached to the edge.`,
    })
    public node: TNode;

    @GQL.Field(_type => String, {
      description: 'An opaque cursor that can be used to retrieve further pages of edges before or after this one.',
    })
    public cursor: string;

    constructor(fields?: Partial<EdgeInterface<TNode>>) {
      if (fields != null) {
        if (fields.node != null) {
          this.node = fields.node;
        }

        if (fields.cursor != null) {
          this.cursor = fields.cursor;
        }
      }
    }
  }

  return Edge;
}
