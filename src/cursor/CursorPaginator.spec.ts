import Joi from 'joi';
import { EdgeFactory } from '../factory';
import { createConnectionType, createEdgeType } from '../type';
import { Cursor } from './Cursor';
import { CursorPaginator } from './CursorPaginator';
import { validateCursorParameters } from './validateCursorParameters';

class TestNode {
  id: string;
}

class TestEdge extends createEdgeType(TestNode) {}

class TestConnection extends createConnectionType(TestEdge) {}

type TestCursorParams = { id: string };

const testCursorSchema = Joi.object({
  id: Joi.string().empty('').required(),
}).unknown(false);

const testEdgeFactory: EdgeFactory<TestEdge, TestNode, Cursor<TestCursorParams>> = {
  createEdge(node) {
    return new TestEdge({
      node,
      cursor: this.createCursor(node).encode(),
    });
  },
  createCursor(node) {
    return new Cursor({ id: node.id });
  },
  decodeCursor(encodedString: string) {
    return Cursor.fromString(encodedString, params => validateCursorParameters(params, testCursorSchema));
  },
};

describe('CursorPaginator', () => {
  test('PageInfo is correct for first page', () => {
    const paginator = new CursorPaginator<TestConnection, TestEdge, TestCursorParams>({
      edgeFactory: testEdgeFactory,
      edgesPerPage: 5,
      totalEdges: 12,
    });
    const pageInfo = paginator.createPageInfo({
      edges: paginator.createEdges([
        { id: 'node1' },
        { id: 'node2' },
        { id: 'node3' },
        { id: 'node4' },
        { id: 'node5' },
      ]),
      hasMore: true,
    });

    expect(pageInfo.totalEdges).toBe(12);
    expect(pageInfo.hasPreviousPage).toBe(false);
    expect(pageInfo.hasNextPage).toBe(true);
    expect(pageInfo.startCursor).toBeDefined();
    expect(Cursor.fromString(pageInfo.startCursor!).parameters.id).toStrictEqual('node1');
    expect(pageInfo.endCursor).toBeDefined();
    expect(Cursor.fromString(pageInfo.endCursor!).parameters.id).toStrictEqual('node5');
  });

  test('PageInfo is correct for second page', () => {
    const paginator = new CursorPaginator<TestConnection, TestEdge, TestCursorParams>({
      edgeFactory: testEdgeFactory,
      edgesPerPage: 5,
      totalEdges: 12,
      afterCursor: new Cursor<TestCursorParams>({ id: 'node5' }),
    });
    const pageInfo = paginator.createPageInfo({
      edges: paginator.createEdges([
        { id: 'node6' },
        { id: 'node7' },
        { id: 'node8' },
        { id: 'node9' },
        { id: 'node10' },
      ]),
      hasMore: true,
    });

    expect(pageInfo.totalEdges).toBe(12);
    expect(pageInfo.hasPreviousPage).toBe(true);
    expect(pageInfo.hasNextPage).toBe(true);
    expect(pageInfo.startCursor).toBeDefined();
    expect(Cursor.fromString(pageInfo.startCursor!).parameters.id).toStrictEqual('node6');
    expect(pageInfo.endCursor).toBeDefined();
    expect(Cursor.fromString(pageInfo.endCursor!).parameters.id).toStrictEqual('node10');
  });

  test('PageInfo is correct for last page', () => {
    const paginator = new CursorPaginator<TestConnection, TestEdge, TestCursorParams>({
      edgeFactory: testEdgeFactory,
      edgesPerPage: 5,
      totalEdges: 12,
      afterCursor: new Cursor<TestCursorParams>({ id: 'node10' }),
    });
    const pageInfo = paginator.createPageInfo({
      edges: paginator.createEdges([{ id: 'node11' }, { id: 'node12' }]),
      hasMore: false,
    });

    expect(pageInfo.totalEdges).toBe(12);
    expect(pageInfo.hasPreviousPage).toBe(true);
    expect(pageInfo.hasNextPage).toBe(false);
    expect(pageInfo.startCursor).toBeDefined();
    expect(Cursor.fromString(pageInfo.startCursor!).parameters.id).toStrictEqual('node11');
    expect(pageInfo.endCursor).toBeDefined();
    expect(Cursor.fromString(pageInfo.endCursor!).parameters.id).toStrictEqual('node12');
  });

  test('PageInfo is correct for empty result', () => {
    const paginator = new CursorPaginator<TestConnection, TestEdge, TestCursorParams>({
      edgeFactory: testEdgeFactory,
      edgesPerPage: 5,
      totalEdges: 0,
    });
    const pageInfo = paginator.createPageInfo({
      edges: paginator.createEdges([]),
      hasMore: false,
    });

    expect(pageInfo.totalEdges).toBe(0);
    expect(pageInfo.hasPreviousPage).toBe(false);
    expect(pageInfo.hasNextPage).toBe(false);
    expect(pageInfo.startCursor).toBeNull();
    expect(pageInfo.endCursor).toBeNull();
  });
});
