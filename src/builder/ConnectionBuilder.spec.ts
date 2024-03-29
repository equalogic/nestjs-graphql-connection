import Joi from 'joi';
import { Cursor } from '../cursor/Cursor';
import { validateParamsUsingSchema } from '../cursor/validateParamsUsingSchema';
import { ConnectionArgs, createConnectionType, createEdgeType, PageInfo } from '../type';
import { ConnectionBuilder } from './ConnectionBuilder';

class TestNode {
  id: string;
  name: string;
}

class TestEdge extends createEdgeType<{ customEdgeField?: number }>(TestNode) {
  public customEdgeField?: number;
}

class TestConnection extends createConnectionType<{ customConnectionField?: number }>(TestEdge) {
  public customConnectionField?: number;
}

class TestConnectionArgs extends ConnectionArgs {
  public sortOption?: string;
}

type TestCursorParams = { id?: string; name?: string };

type TestCursor = Cursor<TestCursorParams>;

class TestConnectionBuilder extends ConnectionBuilder<
  TestConnection,
  TestConnectionArgs,
  TestEdge,
  TestNode,
  TestCursor
> {
  public createConnection(fields: { edges: TestEdge[]; pageInfo: PageInfo }): TestConnection {
    return new TestConnection(fields);
  }

  public createEdge(fields: { node: TestNode; cursor: string }): TestEdge {
    return new TestEdge(fields);
  }

  public createCursor(node: TestNode): TestCursor {
    return new Cursor({ id: node.id });
  }

  public decodeCursor(encodedString: string): TestCursor {
    const schema: Joi.ObjectSchema<TestCursorParams> = Joi.object({
      id: Joi.string().empty('').required(),
    }).unknown(false);

    return Cursor.fromString(encodedString, params => validateParamsUsingSchema(params, schema));
  }
}

describe('ConnectionBuilder', () => {
  test('First page is built correctly', () => {
    const builder = new TestConnectionBuilder({
      first: 5,
    });

    expect(builder.edgesPerPage).toBe(5);
    expect(builder.afterCursor).toBeUndefined();
    expect(builder.beforeCursor).toBeUndefined();

    const connection = builder.build({
      totalEdges: 12,
      nodes: [
        { id: 'node1', name: 'A' },
        { id: 'node2', name: 'B' },
        { id: 'node3', name: 'C' },
        { id: 'node4', name: 'D' },
        { id: 'node5', name: 'E' },
      ],
    });

    expect(connection).toMatchObject({
      pageInfo: {
        totalEdges: 12,
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: new Cursor({ id: 'node1' }).encode(),
        endCursor: new Cursor({ id: 'node5' }).encode(),
      },
      edges: [
        { node: { id: 'node1', name: 'A' }, cursor: new Cursor({ id: 'node1' }).encode() },
        { node: { id: 'node2', name: 'B' }, cursor: new Cursor({ id: 'node2' }).encode() },
        { node: { id: 'node3', name: 'C' }, cursor: new Cursor({ id: 'node3' }).encode() },
        { node: { id: 'node4', name: 'D' }, cursor: new Cursor({ id: 'node4' }).encode() },
        { node: { id: 'node5', name: 'E' }, cursor: new Cursor({ id: 'node5' }).encode() },
      ],
    });
  });

  test('Second page is built correctly', () => {
    const builder = new TestConnectionBuilder({
      first: 5,
      after: new Cursor({ id: 'node5' }).encode(),
    });

    expect(builder.edgesPerPage).toBe(5);
    expect(builder.afterCursor).toMatchObject(new Cursor({ id: 'node5' }));
    expect(builder.beforeCursor).toBeUndefined();

    const connection = builder.build({
      totalEdges: 12,
      nodes: [
        { id: 'node6', name: 'F' },
        { id: 'node7', name: 'G' },
        { id: 'node8', name: 'H' },
        { id: 'node9', name: 'I' },
        { id: 'node10', name: 'J' },
      ],
    });

    expect(connection).toMatchObject({
      pageInfo: {
        totalEdges: 12,
        hasNextPage: true,
        hasPreviousPage: true,
        startCursor: new Cursor({ id: 'node6' }).encode(),
        endCursor: new Cursor({ id: 'node10' }).encode(),
      },
      edges: [
        { node: { id: 'node6', name: 'F' }, cursor: new Cursor({ id: 'node6' }).encode() },
        { node: { id: 'node7', name: 'G' }, cursor: new Cursor({ id: 'node7' }).encode() },
        { node: { id: 'node8', name: 'H' }, cursor: new Cursor({ id: 'node8' }).encode() },
        { node: { id: 'node9', name: 'I' }, cursor: new Cursor({ id: 'node9' }).encode() },
        { node: { id: 'node10', name: 'J' }, cursor: new Cursor({ id: 'node10' }).encode() },
      ],
    });
  });

  test('Last page is built correctly', () => {
    const builder = new TestConnectionBuilder({
      first: 5,
      after: new Cursor({ id: 'node10' }).encode(),
    });

    expect(builder.edgesPerPage).toBe(5);
    expect(builder.afterCursor).toMatchObject(new Cursor({ id: 'node10' }));
    expect(builder.beforeCursor).toBeUndefined();

    const connection = builder.build({
      totalEdges: 12,
      nodes: [
        { id: 'node11', name: 'K' },
        { id: 'node12', name: 'L' },
      ],
      hasNextPage: false, // must be set explicitly when using Cursor pagination
    });

    expect(connection).toMatchObject({
      pageInfo: {
        totalEdges: 12,
        hasNextPage: false,
        hasPreviousPage: true,
        startCursor: new Cursor({ id: 'node11' }).encode(),
        endCursor: new Cursor({ id: 'node12' }).encode(),
      },
      edges: [
        { node: { id: 'node11', name: 'K' }, cursor: new Cursor({ id: 'node11' }).encode() },
        { node: { id: 'node12', name: 'L' }, cursor: new Cursor({ id: 'node12' }).encode() },
      ],
    });
  });

  test('Empty result is built correctly', () => {
    const builder = new TestConnectionBuilder({
      first: 5,
    });

    expect(builder.edgesPerPage).toBe(5);
    expect(builder.afterCursor).toBeUndefined();
    expect(builder.beforeCursor).toBeUndefined();

    const connection = builder.build({
      totalEdges: 0,
      nodes: [],
    });

    expect(connection).toMatchObject({
      pageInfo: {
        totalEdges: 0,
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
      edges: [],
    });
  });

  test('Can override createConnection and createEdge when building Connection', () => {
    const builder = new TestConnectionBuilder({
      first: 5,
    });
    const connection = builder.build({
      totalEdges: 12,
      nodes: [
        { id: 'node1', name: 'A' },
        { id: 'node2', name: 'B' },
        { id: 'node3', name: 'C' },
        { id: 'node4', name: 'D' },
        { id: 'node5', name: 'E' },
      ],
      createConnection({ edges, pageInfo }) {
        return new TestConnection({ edges, pageInfo, customConnectionField: 99 });
      },
      createEdge({ node, cursor }) {
        return new TestEdge({ node, cursor, customEdgeField: 99 });
      },
    });

    expect(connection).toMatchObject({
      pageInfo: {
        totalEdges: 12,
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: new Cursor({ id: 'node1' }).encode(),
        endCursor: new Cursor({ id: 'node5' }).encode(),
      },
      edges: [
        { node: { id: 'node1', name: 'A' }, cursor: new Cursor({ id: 'node1' }).encode(), customEdgeField: 99 },
        { node: { id: 'node2', name: 'B' }, cursor: new Cursor({ id: 'node2' }).encode(), customEdgeField: 99 },
        { node: { id: 'node3', name: 'C' }, cursor: new Cursor({ id: 'node3' }).encode(), customEdgeField: 99 },
        { node: { id: 'node4', name: 'D' }, cursor: new Cursor({ id: 'node4' }).encode(), customEdgeField: 99 },
        { node: { id: 'node5', name: 'E' }, cursor: new Cursor({ id: 'node5' }).encode(), customEdgeField: 99 },
      ],
      customConnectionField: 99,
    });
  });

  test('Can override createCursor using connectionArgs when building Connection', () => {
    const builder = new TestConnectionBuilder({
      first: 5,
      sortOption: 'name',
    });
    const connection = builder.build({
      totalEdges: 12,
      nodes: [
        { id: 'node1', name: 'A' },
        { id: 'node2', name: 'B' },
        { id: 'node3', name: 'C' },
        { id: 'node4', name: 'D' },
        { id: 'node5', name: 'E' },
      ],
      createCursor(this: TestConnectionBuilder, node) {
        if (this.connectionArgs.sortOption === 'name') {
          return new Cursor({ name: node.name });
        }

        return new Cursor({ id: node.id });
      },
    });

    expect(connection).toMatchObject({
      pageInfo: {
        totalEdges: 12,
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: new Cursor({ name: 'A' }).encode(),
        endCursor: new Cursor({ name: 'E' }).encode(),
      },
      edges: [
        { node: { id: 'node1', name: 'A' }, cursor: new Cursor({ name: 'A' }).encode() },
        { node: { id: 'node2', name: 'B' }, cursor: new Cursor({ name: 'B' }).encode() },
        { node: { id: 'node3', name: 'C' }, cursor: new Cursor({ name: 'C' }).encode() },
        { node: { id: 'node4', name: 'D' }, cursor: new Cursor({ name: 'D' }).encode() },
        { node: { id: 'node5', name: 'E' }, cursor: new Cursor({ name: 'E' }).encode() },
      ],
    });
  });
});
