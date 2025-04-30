import { Cursor } from '../cursor/Cursor';
import { Baz, BazConnectionBuilder } from '../../test/BazConnection';

describe('OffsetPaginatedConnectionBuilder', () => {
  test('First page is built correctly', () => {
    const builder = new BazConnectionBuilder({
      first: 5,
    });

    expect(builder.edgesPerPage).toBe(5);
    expect(builder.startOffset).toBe(0);
    expect(builder.afterCursor).toBeUndefined();
    expect(builder.beforeCursor).toBeUndefined();

    const connection = builder.build({
      totalEdges: 12,
      nodes: [
        new Baz({ id: 'node1', name: 'A' }),
        new Baz({ id: 'node2', name: 'B' }),
        new Baz({ id: 'node3', name: 'C' }),
        new Baz({ id: 'node4', name: 'D' }),
        new Baz({ id: 'node5', name: 'E' }),
      ],
    });

    expect(connection).toMatchObject({
      pageInfo: {
        totalEdges: 12,
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: new Cursor({ offset: 0 }).encode(),
        endCursor: new Cursor({ offset: 4 }).encode(),
      },
      edges: [
        { node: { id: 'node1', name: 'A' }, cursor: new Cursor({ offset: 0 }).encode() },
        { node: { id: 'node2', name: 'B' }, cursor: new Cursor({ offset: 1 }).encode() },
        { node: { id: 'node3', name: 'C' }, cursor: new Cursor({ offset: 2 }).encode() },
        { node: { id: 'node4', name: 'D' }, cursor: new Cursor({ offset: 3 }).encode() },
        { node: { id: 'node5', name: 'E' }, cursor: new Cursor({ offset: 4 }).encode() },
      ],
    });
  });

  test('Second page is built correctly', () => {
    const builder = new BazConnectionBuilder({
      first: 5,
      after: new Cursor({ offset: 4 }).encode(),
    });

    expect(builder.edgesPerPage).toBe(5);
    expect(builder.startOffset).toBe(5);
    expect(builder.afterCursor).toMatchObject(new Cursor({ offset: 4 }));
    expect(builder.beforeCursor).toBeUndefined();

    const connection = builder.build({
      totalEdges: 12,
      nodes: [
        new Baz({ id: 'node6', name: 'F' }),
        new Baz({ id: 'node7', name: 'G' }),
        new Baz({ id: 'node8', name: 'H' }),
        new Baz({ id: 'node9', name: 'I' }),
        new Baz({ id: 'node10', name: 'J' }),
      ],
    });

    expect(connection).toMatchObject({
      pageInfo: {
        totalEdges: 12,
        hasNextPage: true,
        hasPreviousPage: true,
        startCursor: new Cursor({ offset: 5 }).encode(),
        endCursor: new Cursor({ offset: 9 }).encode(),
      },
      edges: [
        { node: { id: 'node6', name: 'F' }, cursor: new Cursor({ offset: 5 }).encode() },
        { node: { id: 'node7', name: 'G' }, cursor: new Cursor({ offset: 6 }).encode() },
        { node: { id: 'node8', name: 'H' }, cursor: new Cursor({ offset: 7 }).encode() },
        { node: { id: 'node9', name: 'I' }, cursor: new Cursor({ offset: 8 }).encode() },
        { node: { id: 'node10', name: 'J' }, cursor: new Cursor({ offset: 9 }).encode() },
      ],
    });
  });

  test('Last page is built correctly', () => {
    const builder = new BazConnectionBuilder({
      first: 5,
      after: new Cursor({ offset: 9 }).encode(),
    });

    expect(builder.edgesPerPage).toBe(5);
    expect(builder.startOffset).toBe(10);
    expect(builder.afterCursor).toMatchObject(new Cursor({ offset: 9 }));
    expect(builder.beforeCursor).toBeUndefined();

    const connection = builder.build({
      totalEdges: 12,
      nodes: [new Baz({ id: 'node11', name: 'K' }), new Baz({ id: 'node12', name: 'L' })],
    });

    expect(connection).toMatchObject({
      pageInfo: {
        totalEdges: 12,
        hasNextPage: false,
        hasPreviousPage: true,
        startCursor: new Cursor({ offset: 10 }).encode(),
        endCursor: new Cursor({ offset: 11 }).encode(),
      },
      edges: [
        { node: { id: 'node11', name: 'K' }, cursor: new Cursor({ offset: 10 }).encode() },
        { node: { id: 'node12', name: 'L' }, cursor: new Cursor({ offset: 11 }).encode() },
      ],
    });
  });

  test('Empty result is built correctly', () => {
    const builder = new BazConnectionBuilder({
      first: 5,
    });

    expect(builder.edgesPerPage).toBe(5);
    expect(builder.startOffset).toBe(0);
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

  test('Can build Connection using partial Edges', () => {
    const builder = new BazConnectionBuilder({
      first: 5,
    });
    const connection = builder.build({
      totalEdges: 12,
      edges: [
        { node: new Baz({ id: 'node1', name: 'A' }), customEdgeField: 1 },
        { node: new Baz({ id: 'node2', name: 'B' }), customEdgeField: 2 },
        { node: new Baz({ id: 'node3', name: 'C' }), customEdgeField: 3 },
        { node: new Baz({ id: 'node4', name: 'D' }), customEdgeField: 4 },
        { node: new Baz({ id: 'node5', name: 'E' }), customEdgeField: 5 },
      ],
    });

    expect(connection).toMatchObject({
      pageInfo: {
        totalEdges: 12,
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: new Cursor({ offset: 0 }).encode(),
        endCursor: new Cursor({ offset: 4 }).encode(),
      },
      edges: [
        { node: { id: 'node1', name: 'A' }, cursor: new Cursor({ offset: 0 }).encode(), customEdgeField: 1 },
        { node: { id: 'node2', name: 'B' }, cursor: new Cursor({ offset: 1 }).encode(), customEdgeField: 2 },
        { node: { id: 'node3', name: 'C' }, cursor: new Cursor({ offset: 2 }).encode(), customEdgeField: 3 },
        { node: { id: 'node4', name: 'D' }, cursor: new Cursor({ offset: 3 }).encode(), customEdgeField: 4 },
        { node: { id: 'node5', name: 'E' }, cursor: new Cursor({ offset: 4 }).encode(), customEdgeField: 5 },
      ],
    });
  });
});
