# nestjs-graphql-connection 🐈‍ ⚛️ 🔗

[Relay-style pagination](https://relay.dev/graphql/connections.htm) for NestJS GraphQL server.

## Installation

```shell
npm i nestjs-graphql-connection
```

## Usage

### Create an Edge type

Extend a class from `createEdgeType` function, passing it the class of objects to be represented by the edge's `node`.
For correct typings also indicate that your class implements `EdgeInterface`, as shown:

```ts
import { ObjectType } from '@nestjs/graphql';
import { createEdgeType, EdgeInterface } from 'nestjs-graphql-connection';
import { Person } from './entities';

@ObjectType()
export class PersonEdge extends createEdgeType(Person) implements EdgeInterface<Person> {
}
```

### Create a Connection type

Extend a class from `createConnectionType` function, passing it the class of objects to be represented by the
connection's `edges`:

```ts
import { ObjectType } from '@nestjs/graphql';
import { createConnectionType } from 'nestjs-graphql-connection';

@ObjectType()
export class PersonConnection extends createConnectionType(PersonEdge) {
}
```

### Create a Connection Arguments type

Extend a class from `ConnectionArgs` class to have pagination arguments pre-defined for you. You can additionally
define your own arguments for filtering, etc.

```ts
import { ArgsType, Field, ID } from '@nestjs/graphql';
import { ConnectionArgs } from 'nestjs-graphql-connection';

@ArgsType()
export class PersonConnectionArgs extends ConnectionArgs {
  /*
   * PersonConnectionArgs will inherit `first`, `last`, `before`, `after`, and `page` fields from ConnectionArgs
   */

  // Optional: example of a custom argument for filtering
  @Field(type => ID, { nullable: true })
  public personId?: string;
}
```

### Return a Connection from a Query Resolver

Your resolvers can return a `Connection` as an object type. Use a `Paginator` class to help you determine which page
of results to fetch and to create `PageInfo` and cursors in the result.

#### Using Offset Pagination

With offset pagination, cursor values are an encoded representation of the row offset. It is possible for clients to
paginate by specifying either an `after` argument with the cursor of the last row on the previous page, or to pass a
`page` argument with an explicit page number (based on the rows per page set by the `first` argument).

```ts
import { Query, Resolver } from '@nestjs/graphql';
import { OffsetCursorPaginator } from 'nestjs-graphql-connection';

@Resolver()
export class PersonQueryResolver {
  @Query(returns => PersonConnection)
  public async persons(@Args() connectionArgs: PersonConnectionArgs): Promise<PersonConnection> {
    const { personId } = connectionArgs;

    // Example: Count the total number of matching persons (ignoring pagination)
    const totalPersons = await countPersons({ where: { personId } });

    // Create paginator instance
    const paginator = OffsetCursorPaginator.createFromConnectionArgs<PersonEdge>({
      ...connectionArgs,
      totalEdges: totalPersons,
      createEdge({ node, cursor }) {
        return new PersonEdge({
          node,
          cursor,
        });
      },
      createCursor(node, offset) {
        return new OffsetCursor({ offset });
      },
    });

    // Example: Do whatever you need to do to fetch the current page of persons
    const persons = await fetchPersons({
      where: { personId },
      take: paginator.edgesPerPage, // how many rows to fetch
      skip: paginator.startOffset,  // row offset to fetch from
    });

    const edges = paginator.createEdges(persons);

    // Return resolved PersonConnection with edges and pageInfo
    return new PersonConnection({
      pageInfo: paginator.createPageInfo({ edges }),
      edges,
    });
  }
}
```

#### Using Cursor Pagination

🚧 **WIP** 🚧

_Cursors are ready but there is no Paginator class implementation yet._
