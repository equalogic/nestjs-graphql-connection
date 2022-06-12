import * as GQL from '@nestjs/graphql';
import * as Relay from 'graphql-relay';
import { Initializable } from 'ts-class-initializable';

export interface EdgeInterface<TNode> extends Relay.Edge<TNode> {
  node: TNode;
  cursor: string;
}

export function createEdgeType<TInitFields extends Record<string, any> = Record<string, any>, TNode = any>(
  TNodeClass: new () => TNode,
): new (fields: EdgeInterface<TNode> & TInitFields) => EdgeInterface<TNode> {
  // This class should be further extended by concrete Edge types. It can't be marked as
  // an abstract class because TS lacks support for returning `abstract new()...` as a type
  // (https://github.com/Microsoft/TypeScript/issues/25606)
  @GQL.ObjectType({ isAbstract: true })
  class Edge extends Initializable<EdgeInterface<TNode> & TInitFields> implements EdgeInterface<TNode> {
    @GQL.Field(_type => TNodeClass, {
      description: `The node object (belonging to type ${TNodeClass.name}) attached to the edge.`,
    })
    public node: TNode;

    @GQL.Field(_type => String, {
      description: 'An opaque cursor that can be used to retrieve further pages of edges before or after this one.',
    })
    public cursor: string;
  }

  return Edge;
}
