import { Field, GqlTypeReference, ObjectType } from '@nestjs/graphql';
import { Initializable } from 'ts-class-initializable';

export interface EdgeInterface<TNode> {
  node: TNode;
  cursor: string;
}

export function createEdgeType<TInitFields extends Record<string, any> = Record<string, any>, TNode = any>(
  nodeType: GqlTypeReference,
  nodeTypeName?: string,
): new (fields: EdgeInterface<TNode> & TInitFields) => EdgeInterface<TNode> {
  nodeTypeName = nodeTypeName ?? (typeof nodeType === 'function' && nodeType.name ? nodeType.name : undefined);

  // This class should be further extended by concrete Edge types. It can't be marked as
  // an abstract class because TS lacks support for returning `abstract new()...` as a type
  // (https://github.com/Microsoft/TypeScript/issues/25606)
  @ObjectType({ isAbstract: true })
  class Edge extends Initializable<EdgeInterface<TNode> & TInitFields> implements EdgeInterface<TNode> {
    @Field(_type => nodeType, {
      description: `The node object ${nodeTypeName ? `(belonging to type ${nodeTypeName}) ` : ''}attached to the edge.`,
    })
    public node: TNode;

    @Field(_type => String, {
      description: 'An opaque cursor that can be used to retrieve further pages of edges before or after this one.',
    })
    public cursor: string;
  }

  return Edge;
}
