import { OffsetCursor } from './OffsetCursor';
import { OffsetCursorPaginator } from './OffsetCursorPaginator';

describe('OffsetCursorPaginator', () => {
  test('PageInfo is correct for first page', () => {
    const paginator = new OffsetCursorPaginator({
      edgesPerPage: 20,
      skip: 0,
      totalEdges: 50,
    });
    const pageInfo = paginator.createPageInfo(20);

    expect(pageInfo.totalEdges).toBe(50);
    expect(pageInfo.hasPreviousPage).toBe(false);
    expect(pageInfo.hasNextPage).toBe(true);
    expect(pageInfo.startCursor).toBeDefined();
    expect(OffsetCursor.fromString(pageInfo.startCursor!).parameters.offset).toStrictEqual(0);
    expect(pageInfo.endCursor).toBeDefined();
    expect(OffsetCursor.fromString(pageInfo.endCursor!).parameters.offset).toStrictEqual(19);
  });

  test('PageInfo is correct for second page', () => {
    const paginator = new OffsetCursorPaginator({
      edgesPerPage: 20,
      skip: 20,
      totalEdges: 50,
    });
    const pageInfo = paginator.createPageInfo(20);

    expect(pageInfo.totalEdges).toBe(50);
    expect(pageInfo.hasPreviousPage).toBe(true);
    expect(pageInfo.hasNextPage).toBe(true);
    expect(pageInfo.startCursor).toBeDefined();
    expect(OffsetCursor.fromString(pageInfo.startCursor!).parameters.offset).toStrictEqual(20);
    expect(pageInfo.endCursor).toBeDefined();
    expect(OffsetCursor.fromString(pageInfo.endCursor!).parameters.offset).toStrictEqual(39);
  });

  test('PageInfo is correct for last page', () => {
    const paginator = new OffsetCursorPaginator({
      edgesPerPage: 20,
      skip: 40,
      totalEdges: 50,
    });
    const pageInfo = paginator.createPageInfo(10);

    expect(pageInfo.totalEdges).toBe(50);
    expect(pageInfo.hasPreviousPage).toBe(true);
    expect(pageInfo.hasNextPage).toBe(false);
    expect(pageInfo.startCursor).toBeDefined();
    expect(OffsetCursor.fromString(pageInfo.startCursor!).parameters.offset).toStrictEqual(40);
    expect(pageInfo.endCursor).toBeDefined();
    expect(OffsetCursor.fromString(pageInfo.endCursor!).parameters.offset).toStrictEqual(49);
  });

  test('PageInfo is correct for fixed offset pagination', () => {
    const paginator = OffsetCursorPaginator.createFromConnectionArgs(
      {
        first: 20,
        page: 4,
      },
      100,
    );
    const pageInfo = paginator.createPageInfo(20);

    expect(pageInfo.totalEdges).toBe(100);
    expect(pageInfo.hasPreviousPage).toBe(true);
    expect(pageInfo.hasNextPage).toBe(true);
    expect(pageInfo.startCursor).toBeDefined();
    expect(OffsetCursor.fromString(pageInfo.startCursor!).parameters.offset).toStrictEqual(60);
    expect(pageInfo.endCursor).toBeDefined();
    expect(OffsetCursor.fromString(pageInfo.endCursor!).parameters.offset).toStrictEqual(79);
  });
});
