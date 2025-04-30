import { Cursor } from '../cursor/Cursor';
import { Foo, FooConnection, FooConnectionBuilder, FooEdge } from '../../test/FooConnection';
import { BarConnectionBuilder, FruitBar, NutBar } from '../../test/BarConnection';

describe('ConnectionBuilder', () => {
  test('First page is built correctly', () => {
    const builder = new FooConnectionBuilder({
      first: 5,
    });

    expect(builder.edgesPerPage).toBe(5);
    expect(builder.afterCursor).toBeUndefined();
    expect(builder.beforeCursor).toBeUndefined();

    const connection = builder.build({
      totalEdges: 12,
      nodes: [
        new Foo({ id: 'node1', name: 'A' }),
        new Foo({ id: 'node2', name: 'B' }),
        new Foo({ id: 'node3', name: 'C' }),
        new Foo({ id: 'node4', name: 'D' }),
        new Foo({ id: 'node5', name: 'E' }),
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
    const builder = new FooConnectionBuilder({
      first: 5,
      after: new Cursor({ id: 'node5' }).encode(),
    });

    expect(builder.edgesPerPage).toBe(5);
    expect(builder.afterCursor).toMatchObject(new Cursor({ id: 'node5' }));
    expect(builder.beforeCursor).toBeUndefined();

    const connection = builder.build({
      totalEdges: 12,
      nodes: [
        new Foo({ id: 'node6', name: 'F' }),
        new Foo({ id: 'node7', name: 'G' }),
        new Foo({ id: 'node8', name: 'H' }),
        new Foo({ id: 'node9', name: 'I' }),
        new Foo({ id: 'node10', name: 'J' }),
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
    const builder = new FooConnectionBuilder({
      first: 5,
      after: new Cursor({ id: 'node10' }).encode(),
    });

    expect(builder.edgesPerPage).toBe(5);
    expect(builder.afterCursor).toMatchObject(new Cursor({ id: 'node10' }));
    expect(builder.beforeCursor).toBeUndefined();

    const connection = builder.build({
      totalEdges: 12,
      nodes: [new Foo({ id: 'node11', name: 'K' }), new Foo({ id: 'node12', name: 'L' })],
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
    const builder = new FooConnectionBuilder({
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
    const builder = new FooConnectionBuilder({
      first: 5,
    });
    const connection = builder.build({
      totalEdges: 12,
      nodes: [
        new Foo({ id: 'node1', name: 'A' }),
        new Foo({ id: 'node2', name: 'B' }),
        new Foo({ id: 'node3', name: 'C' }),
        new Foo({ id: 'node4', name: 'D' }),
        new Foo({ id: 'node5', name: 'E' }),
      ],
      createConnection({ edges, pageInfo }) {
        return new FooConnection({ edges, pageInfo, customConnectionField: 99 });
      },
      createEdge({ node, cursor }) {
        return new FooEdge({ node, cursor, customEdgeField: 99 });
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
    const builder = new FooConnectionBuilder({
      first: 5,
      sortOption: 'name',
    });
    const connection = builder.build({
      totalEdges: 12,
      nodes: [
        new Foo({ id: 'node1', name: 'A' }),
        new Foo({ id: 'node2', name: 'B' }),
        new Foo({ id: 'node3', name: 'C' }),
        new Foo({ id: 'node4', name: 'D' }),
        new Foo({ id: 'node5', name: 'E' }),
      ],
      createCursor(this: FooConnectionBuilder, node) {
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

  test('Can build Connection using partial Edges', () => {
    const builder = new FooConnectionBuilder({
      first: 5,
    });
    const connection = builder.build({
      totalEdges: 12,
      edges: [
        { node: new Foo({ id: 'node1', name: 'A' }), customEdgeField: 1 },
        { node: new Foo({ id: 'node2', name: 'B' }), customEdgeField: 2 },
        { node: new Foo({ id: 'node3', name: 'C' }), customEdgeField: 3 },
        { node: new Foo({ id: 'node4', name: 'D' }), customEdgeField: 4 },
        { node: new Foo({ id: 'node5', name: 'E' }), customEdgeField: 5 },
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
        { node: { id: 'node1', name: 'A' }, cursor: new Cursor({ id: 'node1' }).encode(), customEdgeField: 1 },
        { node: { id: 'node2', name: 'B' }, cursor: new Cursor({ id: 'node2' }).encode(), customEdgeField: 2 },
        { node: { id: 'node3', name: 'C' }, cursor: new Cursor({ id: 'node3' }).encode(), customEdgeField: 3 },
        { node: { id: 'node4', name: 'D' }, cursor: new Cursor({ id: 'node4' }).encode(), customEdgeField: 4 },
        { node: { id: 'node5', name: 'E' }, cursor: new Cursor({ id: 'node5' }).encode(), customEdgeField: 5 },
      ],
    });
  });

  test('Can build Connection with Nodes having a union type', () => {
    const builder = new BarConnectionBuilder({
      first: 5,
    });
    const connection = builder.build({
      totalEdges: 12,
      nodes: [
        new FruitBar({ id: 'node1', name: 'Apple', sugars: 123 }),
        new FruitBar({ id: 'node2', name: 'Banana', sugars: 87 }),
        new NutBar({ id: 'node3', name: 'Peanut', protein: 12 }),
        new NutBar({ id: 'node4', name: 'Macadamia', protein: 23 }),
        new FruitBar({ id: 'node5', name: 'Orange', sugars: 234 }),
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
        { node: { id: 'node1', name: 'Apple', sugars: 123 }, cursor: new Cursor({ id: 'node1' }).encode() },
        { node: { id: 'node2', name: 'Banana', sugars: 87 }, cursor: new Cursor({ id: 'node2' }).encode() },
        { node: { id: 'node3', name: 'Peanut', protein: 12 }, cursor: new Cursor({ id: 'node3' }).encode() },
        { node: { id: 'node4', name: 'Macadamia', protein: 23 }, cursor: new Cursor({ id: 'node4' }).encode() },
        { node: { id: 'node5', name: 'Orange', sugars: 234 }, cursor: new Cursor({ id: 'node5' }).encode() },
      ],
    });
  });
});
