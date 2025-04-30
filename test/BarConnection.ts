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
import { createUnionType } from '@nestjs/graphql';
import { Initializable } from 'ts-class-initializable';

export class FruitBar extends Initializable<FruitBar> {
  id: string;
  name: string;
  sugars: number;
}

export class NutBar extends Initializable<NutBar> {
  id: string;
  name: string;
  protein: number;
}

export const BarUnion = createUnionType({
  name: 'BarUnion',
  types: () => [FruitBar, NutBar],
});

export interface BarEdgeInterface extends EdgeInterface<typeof BarUnion> {
  customEdgeField?: number;
}

export class BarEdge extends createEdgeType<BarEdgeInterface>(BarUnion) implements BarEdgeInterface {
  public customEdgeField?: number;
}

export interface BarConnectionInterface extends ConnectionInterface<BarEdge> {
  customConnectionField?: number;
}

export class BarConnection
  extends createConnectionType<BarConnectionInterface>(BarEdge)
  implements BarConnectionInterface
{
  public customConnectionField?: number;
}

export class BarConnectionArgs extends ConnectionArgs {
  public sortOption?: string;
}

export type BarCursorParams = { id?: string };

export type BarCursor = Cursor<BarCursorParams>;

export class BarConnectionBuilder extends ConnectionBuilder<
  BarConnection,
  BarConnectionArgs,
  BarEdge,
  typeof BarUnion,
  BarCursor
> {
  public createConnection(fields: { edges: BarEdge[]; pageInfo: PageInfo }): BarConnection {
    return new BarConnection(fields);
  }

  public createEdge(fields: EdgeInputWithCursor<BarEdge>): BarEdge {
    return new BarEdge(fields);
  }

  public createCursor(node: typeof BarUnion): BarCursor {
    return new Cursor({ id: node.id });
  }

  public decodeCursor(encodedString: string): BarCursor {
    const schema: Joi.ObjectSchema<BarCursorParams> = Joi.object({
      id: Joi.string().empty('').required(),
    }).unknown(false);

    return Cursor.fromString(encodedString, params => validateParamsUsingSchema(params, schema));
  }
}
