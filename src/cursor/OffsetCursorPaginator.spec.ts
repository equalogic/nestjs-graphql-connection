import { EdgeFactoryInterface } from '../factory';
import { createEdgeType } from '../type';
import { OffsetCursor, OffsetCursorParameters } from './OffsetCursor';
import { OffsetCursorPaginator } from './OffsetCursorPaginator';

class TestNode {
  id: string;
}

class TestEdge extends createEdgeType(TestNode) {}

const testEdgeFactory: EdgeFactoryInterface<TestNode, TestEdge, OffsetCursorParameters, OffsetCursor> = {
  createEdge(node, offset) {
    return new TestEdge({
      node,
      cursor: this.createCursor(node, offset).encode(),
    });
  },
  createCursor(node, offset) {
    return new OffsetCursor({ offset });
  },
};

describe('OffsetCursorPaginator', () => {
  test('PageInfo is correct for first page', () => {
    const paginator = new OffsetCursorPaginator<TestEdge>({
      edgeFactory: testEdgeFactory,
      edgesPerPage: 5,
      totalEdges: 12,
      startOffset: 0,
    });
    const pageInfo = paginator.createPageInfo({
      edges: paginator.createEdges([
        { id: 'node1' },
        { id: 'node2' },
        { id: 'node3' },
        { id: 'node4' },
        { id: 'node5' },
      ]),
    });

    expect(pageInfo.totalEdges).toBe(12);
    expect(pageInfo.hasPreviousPage).toBe(false);
    expect(pageInfo.hasNextPage).toBe(true);
    expect(pageInfo.startCursor).toBeDefined();
    expect(OffsetCursor.fromString(pageInfo.startCursor!).parameters.offset).toStrictEqual(0);
    expect(pageInfo.endCursor).toBeDefined();
    expect(OffsetCursor.fromString(pageInfo.endCursor!).parameters.offset).toStrictEqual(4);
  });

  test('PageInfo is correct for second page', () => {
    const paginator = new OffsetCursorPaginator<TestEdge>({
      edgeFactory: testEdgeFactory,
      edgesPerPage: 5,
      totalEdges: 12,
      startOffset: 5,
    });
    const pageInfo = paginator.createPageInfo({
      edges: paginator.createEdges([
        { id: 'node6' },
        { id: 'node7' },
        { id: 'node8' },
        { id: 'node9' },
        { id: 'node10' },
      ]),
    });

    expect(pageInfo.totalEdges).toBe(12);
    expect(pageInfo.hasPreviousPage).toBe(true);
    expect(pageInfo.hasNextPage).toBe(true);
    expect(pageInfo.startCursor).toBeDefined();
    expect(OffsetCursor.fromString(pageInfo.startCursor!).parameters.offset).toStrictEqual(5);
    expect(pageInfo.endCursor).toBeDefined();
    expect(OffsetCursor.fromString(pageInfo.endCursor!).parameters.offset).toStrictEqual(9);
  });

  test('PageInfo is correct for last page', () => {
    const paginator = new OffsetCursorPaginator<TestEdge>({
      edgeFactory: testEdgeFactory,
      edgesPerPage: 5,
      totalEdges: 12,
      startOffset: 10,
    });
    const pageInfo = paginator.createPageInfo({
      edges: paginator.createEdges([{ id: 'node11' }, { id: 'node12' }]),
    });

    expect(pageInfo.totalEdges).toBe(12);
    expect(pageInfo.hasPreviousPage).toBe(true);
    expect(pageInfo.hasNextPage).toBe(false);
    expect(pageInfo.startCursor).toBeDefined();
    expect(OffsetCursor.fromString(pageInfo.startCursor!).parameters.offset).toStrictEqual(10);
    expect(pageInfo.endCursor).toBeDefined();
    expect(OffsetCursor.fromString(pageInfo.endCursor!).parameters.offset).toStrictEqual(11);
  });

  test('PageInfo is correct for fixed offset pagination', () => {
    const paginator = OffsetCursorPaginator.createFromConnectionArgs<TestEdge>({
      edgeFactory: testEdgeFactory,
      first: 5,
      page: 2,
      totalEdges: 12,
    });
    const pageInfo = paginator.createPageInfo({
      edges: paginator.createEdges([
        { id: 'node6' },
        { id: 'node7' },
        { id: 'node8' },
        { id: 'node9' },
        { id: 'node10' },
      ]),
    });

    expect(pageInfo.totalEdges).toBe(12);
    expect(pageInfo.hasPreviousPage).toBe(true);
    expect(pageInfo.hasNextPage).toBe(true);
    expect(pageInfo.startCursor).toBeDefined();
    expect(OffsetCursor.fromString(pageInfo.startCursor!).parameters.offset).toStrictEqual(5);
    expect(pageInfo.endCursor).toBeDefined();
    expect(OffsetCursor.fromString(pageInfo.endCursor!).parameters.offset).toStrictEqual(9);
  });

  test('PageInfo is correct for empty result', () => {
    const paginator = new OffsetCursorPaginator<TestEdge>({
      edgeFactory: testEdgeFactory,
      edgesPerPage: 5,
      totalEdges: 0,
      startOffset: 0,
    });
    const pageInfo = paginator.createPageInfo({
      edges: paginator.createEdges([]),
    });

    expect(pageInfo.totalEdges).toBe(0);
    expect(pageInfo.hasPreviousPage).toBe(false);
    expect(pageInfo.hasNextPage).toBe(false);
    expect(pageInfo.startCursor).toBeNull();
    expect(pageInfo.endCursor).toBeNull();
  });
});
