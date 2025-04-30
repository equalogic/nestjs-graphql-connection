import {
  ConnectionArgs,
  ConnectionBuilder,
  ConnectionInterface,
  createConnectionType,
  createEdgeType,
  Cursor,
  EdgeInputWithCursor,
  EdgeInterface,
  PageInfo,
  validateParamsUsingSchema,
} from '../src';
import Joi from 'joi';
import { Initializable } from 'ts-class-initializable';

export class Foo extends Initializable<Foo> {
  id: string;
  name: string;
}

export interface FooEdgeInterface extends EdgeInterface<Foo> {
  customEdgeField?: number;
}

export class FooEdge extends createEdgeType<FooEdgeInterface>(Foo) implements FooEdgeInterface {
  public customEdgeField?: number;
}

export interface FooConnectionInterface extends ConnectionInterface<FooEdge> {
  customConnectionField?: number;
}

export class FooConnection
  extends createConnectionType<FooConnectionInterface>(FooEdge)
  implements FooConnectionInterface
{
  public customConnectionField?: number;
}

export class FooConnectionArgs extends ConnectionArgs {
  public sortOption?: string;
}

export type FooCursorParams = { id?: string; name?: string };
export type FooCursor = Cursor<FooCursorParams>;

export class FooConnectionBuilder extends ConnectionBuilder<FooConnection, FooConnectionArgs, FooEdge, Foo, FooCursor> {
  public createConnection(fields: { edges: FooEdge[]; pageInfo: PageInfo }): FooConnection {
    return new FooConnection(fields);
  }

  public createEdge(fields: EdgeInputWithCursor<FooEdge>): FooEdge {
    return new FooEdge(fields);
  }

  public createCursor(node: Foo): FooCursor {
    return new Cursor({ id: node.id });
  }

  public decodeCursor(encodedString: string): FooCursor {
    const schema: Joi.ObjectSchema<FooCursorParams> = Joi.object({
      id: Joi.string().empty('').required(),
    }).unknown(false);

    return Cursor.fromString(encodedString, params => validateParamsUsingSchema(params, schema));
  }
}
