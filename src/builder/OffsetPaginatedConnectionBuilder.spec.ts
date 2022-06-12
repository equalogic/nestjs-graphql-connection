import { Cursor } from '../cursor/Cursor';
import { ConnectionArgs, createConnectionType, createEdgeType, PageInfo } from '../type';
import { OffsetPaginatedConnectionBuilder } from './OffsetPaginatedConnectionBuilder';

class TestNode {
  id: string;
}

class TestEdge extends createEdgeType(TestNode) {}

class TestConnection extends createConnectionType(TestEdge) {}

class TestConnectionArgs extends ConnectionArgs {}

class TestConnectionBuilder extends OffsetPaginatedConnectionBuilder<
  TestConnection,
  TestConnectionArgs,
  TestEdge,
  TestNode
> {
  public createConnection(fields: { edges: TestEdge[]; pageInfo: PageInfo }): TestConnection {
    return new TestConnection(fields);
  }

  public createEdge(fields: { node: TestNode; cursor: string }): TestEdge {
    return new TestEdge(fields);
  }
}

describe('OffsetPaginatedConnectionBuilder', () => {
  test('First page is built correctly', () => {
    const builder = new TestConnectionBuilder({
      first: 5,
    });

    expect(builder.edgesPerPage).toBe(5);
    expect(builder.startOffset).toBe(0);
    expect(builder.afterCursor).toBeUndefined();
    expect(builder.beforeCursor).toBeUndefined();

    const connection = builder.build({
      totalEdges: 12,
      nodes: [{ id: 'node1' }, { id: 'node2' }, { id: 'node3' }, { id: 'node4' }, { id: 'node5' }],
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
        { node: { id: 'node1' }, cursor: new Cursor({ offset: 0 }).encode() },
        { node: { id: 'node2' }, cursor: new Cursor({ offset: 1 }).encode() },
        { node: { id: 'node3' }, cursor: new Cursor({ offset: 2 }).encode() },
        { node: { id: 'node4' }, cursor: new Cursor({ offset: 3 }).encode() },
        { node: { id: 'node5' }, cursor: new Cursor({ offset: 4 }).encode() },
      ],
    });
  });

  test('Second page is built correctly', () => {
    const builder = new TestConnectionBuilder({
      first: 5,
      after: new Cursor({ offset: 4 }).encode(),
    });

    expect(builder.edgesPerPage).toBe(5);
    expect(builder.startOffset).toBe(5);
    expect(builder.afterCursor).toMatchObject(new Cursor({ offset: 4 }));
    expect(builder.beforeCursor).toBeUndefined();

    const connection = builder.build({
      totalEdges: 12,
      nodes: [{ id: 'node6' }, { id: 'node7' }, { id: 'node8' }, { id: 'node9' }, { id: 'node10' }],
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
        { node: { id: 'node6' }, cursor: new Cursor({ offset: 5 }).encode() },
        { node: { id: 'node7' }, cursor: new Cursor({ offset: 6 }).encode() },
        { node: { id: 'node8' }, cursor: new Cursor({ offset: 7 }).encode() },
        { node: { id: 'node9' }, cursor: new Cursor({ offset: 8 }).encode() },
        { node: { id: 'node10' }, cursor: new Cursor({ offset: 9 }).encode() },
      ],
    });
  });

  test('Last page is built correctly', () => {
    const builder = new TestConnectionBuilder({
      first: 5,
      after: new Cursor({ offset: 9 }).encode(),
    });

    expect(builder.edgesPerPage).toBe(5);
    expect(builder.startOffset).toBe(10);
    expect(builder.afterCursor).toMatchObject(new Cursor({ offset: 9 }));
    expect(builder.beforeCursor).toBeUndefined();

    const connection = builder.build({
      totalEdges: 12,
      nodes: [{ id: 'node11' }, { id: 'node12' }],
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
        { node: { id: 'node11' }, cursor: new Cursor({ offset: 10 }).encode() },
        { node: { id: 'node12' }, cursor: new Cursor({ offset: 11 }).encode() },
      ],
    });
  });

  test('Empty result is built correctly', () => {
    const builder = new TestConnectionBuilder({
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
});
