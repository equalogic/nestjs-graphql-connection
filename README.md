# nestjs-graphql-connection 🐈‍ ⚛️ 🔗

[Relay-style pagination](https://relay.dev/graphql/connections.htm) for NestJS GraphQL server.

## Installation

```shell
npm i nestjs-graphql-connection
```

[![npm version](https://badge.fury.io/js/nestjs-graphql-connection.svg)](https://badge.fury.io/js/nestjs-graphql-connection)

## Usage

### Create an Edge type

Extend a class from `createEdgeType` function, passing it the class of objects to be represented by the edge's `node`.

```ts
import { ObjectType } from '@nestjs/graphql';
import { createEdgeType } from 'nestjs-graphql-connection';
import { Person } from './entities';

@ObjectType()
export class PersonEdge extends createEdgeType(Person) {}
```

### Create a Connection type

Extend a class from `createConnectionType` function, passing it the class of objects to be represented by the
connection's `edges`:

```ts
import { ObjectType } from '@nestjs/graphql';
import { createConnectionType } from 'nestjs-graphql-connection';

@ObjectType()
export class PersonConnection extends createConnectionType(PersonEdge) {}
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

  // EXAMPLE: Defining a custom argument for filtering
  @Field(type => ID, { nullable: true })
  public personId?: string;
}
```

### Create a Connection Builder and resolve a Connection

Now define a `ConnectionBuilder` class for your `Connection` object. The builder is responsible for interpreting
pagination arguments for the connection, and creating the cursors and `Edge` objects that make up the connection.

```ts
import { ConnectionBuilder, Cursor, PageInfo, validateParamsUsingSchema } from 'nestjs-graphql-connection';

export type PersonCursorParams = { id: string };
export type PersonCursor = Cursor<PersonCursorParams>;

export class PersonConnectionBuilder extends ConnectionBuilder<
  PersonConnection,
  PersonConnectionArgs,
  PersonEdge,
  Person,
  PersonCursor
> {
  public createConnection(fields: { edges: PersonEdge[]; pageInfo: PageInfo }): PersonConnection {
    return new PersonConnection(fields);
  }

  public createEdge(fields: { node: TestNode; cursor: string }): TestEdge {
    return new PersonEdge(fields);
  }

  public createCursor(node: Person): PersonCursor {
    return new Cursor({ id: node.id });
  }

  public decodeCursor(encodedString: string): PersonCursor {
    // A cursor sent to or received from a client is represented as a base64-encoded, URL-style query string containing
    // one or more key/value pairs describing the referenced node's position in the result set (its ID, a date, etc.)
    // Validation is optional, but recommended to enforce that cursor values supplied by clients must be well-formed.
    // See documentation for Joi at https://joi.dev/api/?v=17#object
    // The following schema accepts only an object matching the type { id: string }:
    const schema: Joi.ObjectSchema<PersonCursorParams> = Joi.object({
      id: Joi.string().empty('').required(),
    }).unknown(false);

    return Cursor.fromString(encodedString, params => validateParamsUsingSchema(params, schema));
  }
}
```

Your resolvers can now return your `Connection` as an object type. Use your `ConnectionBuilder` class to determine which
page of results to fetch and to create the `PageInfo`, cursors, and edges in the result.

```ts
import { Args, Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class PersonQueryResolver {
  @Query(returns => PersonConnection)
  public async persons(@Args() connectionArgs: PersonConnectionArgs): Promise<PersonConnection> {
    const { personId } = connectionArgs;

    // Create builder instance
    const connectionBuilder = new PersonConnectionBuilder(connectionArgs);

    // EXAMPLE: Count the total number of matching persons (without pagination)
    const totalEdges = await countPersons({ where: { personId } });

    // EXAMPLE: Do whatever you need to do to fetch the current page of persons
    const persons = await fetchPersons({
      where: { personId },
      take: connectionBuilder.edgesPerPage, // how many rows to fetch
    });

    // Return resolved PersonConnection with edges and pageInfo
    return connectionBuilder.build({
      totalEdges,
      nodes: persons,
    });
  }
}
```

### Using Offset Pagination

With offset pagination, cursor values are an encoded representation of the row offset. It is possible for clients to
paginate by specifying either an `after` argument with the cursor of the last row on the previous page, or to pass a
`page` argument with an explicit page number (based on the rows per page set by the `first` argument). Offset paginated
connections do not support the `last` or `before` connection arguments, results must be fetched in forward order.

Offset pagination is useful when you want to be able to retrieve a page of edges at an arbitrary position in the result
set, without knowing anything about the intermediate entries. For example, to link to "page 10" without first
determining what the last result was on page 9.

To use offset cursors, extend your builder class from `OffsetPaginatedConnectionBuilder` instead of `ConnectionBuilder`:

```ts
import { OffsetPaginatedConnectionBuilder, PageInfo, validateParamsUsingSchema } from 'nestjs-graphql-connection';

export class PersonConnectionBuilder extends OffsetPaginatedConnectionBuilder<
  PersonConnection,
  PersonConnectionArgs,
  PersonEdge,
  Person
> {
  public createConnection(fields: { edges: PersonEdge[]; pageInfo: PageInfo }): PersonConnection {
    return new PersonConnection(fields);
  }

  public createEdge(fields: { node: TestNode; cursor: string }): TestEdge {
    return new PersonEdge(fields);
  }

  // When extending from OffsetPaginatedConnectionBuilder, cursor encoding/decoding always uses the OffsetCursor type.
  // So it's not necessary to implement the createCursor() or decodeCursor() methods here.
}
```

In your resolver, you can use the `startOffset` property of the builder to determine the zero-indexed offset from which
to begin the result set. For example, this works with SQL databases that accept a `SKIP` or `OFFSET` parameter in
queries.

```ts
import { Args, Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class PersonQueryResolver {
  @Query(returns => PersonConnection)
  public async persons(@Args() connectionArgs: PersonConnectionArgs): Promise<PersonConnection> {
    const { personId } = connectionArgs;

    // Create builder instance
    const connectionBuilder = new PersonConnectionBuilder(connectionArgs);

    // EXAMPLE: Count the total number of matching persons (without pagination)
    const totalEdges = await countPersons({ where: { personId } });

    // EXAMPLE: Do whatever you need to do to fetch the current page of persons
    const persons = await fetchPersons({
      where: { personId },
      take: connectionBuilder.edgesPerPage, // how many rows to fetch
      skip: connectionBuilder.startOffset, // row offset to start at
    });

    // Return resolved PersonConnection with edges and pageInfo
    return connectionBuilder.build({
      totalEdges,
      nodes: persons,
    });
  }
}
```

## Advanced Topics

### Enriching Edges with additional metadata

The previous examples are sufficient for resolving connections that represent simple lists of objects with pagination.
However, sometimes you need to model connections and edges that contain additional metadata. For example, you might
relate `Person` objects together into networks of friends using a `PersonFriendConnection` containing `PersonFriendEdge`
edges. In this case the `node` on each edge is still a `Person` object, but the relationship itself may have
properties -- such as the date that the friend was added, or the type of relationship. (In relational database terms
this is analogous to having a Many-to-Many relation where the intermediate join table contains additional data columns
beyond just the keys of the two joined tables.)

In this case your edge type would look like the following example. Notice that we pass a `{ createdAt: Date }` type
argument to `createEdgeType`; this specifies typings for the fields that are allowed to be passed to your edge class's
constructor for initialization when doing `new PersonFriendEdge({ ...fields })`.

```ts
import { Field, GraphQLISODateTime, ObjectType } from '@nestjs/graphql';
import { createEdgeType } from 'nestjs-graphql-connection';
import { Person } from './entities';

@ObjectType()
export class PersonFriendEdge extends createEdgeType<{ createdAt: Date }>(Person) {
  @Field(type => GraphQLISODateTime)
  public createdAt: Date;
}
```

`ConnectionBuilder` supports overriding the `createConnection()` and `createEdge()` methods when calling `build()`. This
enables you to enrich the connection and edges with additional metadata at resolve time.

The following example assumes you have a GraphQL schema that defines a `friends` field on your `Person` object, which
resolves to a `PersonFriendConnection` containing the person's friends. In your database you would have a `friend` table
that relates a `person` to an `otherPerson`, and that relationship has a `createdAt` date.

```ts
import { Args, ResolveField, Resolver, Root } from '@nestjs/graphql';

@Resolver(of => Person)
export class PersonResolver {
  @ResolveField(returns => PersonFriendConnection)
  public async friends(
    @Root() person: Person,
    @Args() connectionArgs: PersonFriendConnectionArgs,
  ): Promise<PersonFriendConnection> {
    // Create builder instance
    const connectionBuilder = new PersonFriendConnectionBuilder(connectionArgs);

    // EXAMPLE: Count the total number of this person's friends (without pagination)
    const totalEdges = await countFriends({ where: { personId: person.id } });

    // EXAMPLE: Do whatever you need to do to fetch the current page of this person's friends
    const friends = await fetchFriends({
      where: { personId: person.id },
      take: connectionBuilder.edgesPerPage, // how many rows to fetch
    });

    // Return resolved PersonFriendConnection with edges and pageInfo
    return connectionBuilder.build({
      totalEdges,
      nodes: friends.map(friend => friend.otherPerson),
      createEdge: ({ node, cursor }) => {
        const friend = friends.find(friend => friend.otherPerson.id === node.id);

        return new PersonFriendEdge({ node, cursor, createdAt: friend.createdAt });
      },
    });
  }
}
```

Alternatively, you could build the connection result yourself by replacing the `connectionBuilder.build(...)` statement
with something like the following:

```ts
// Resolve edges with cursor, node, and additional metadata
const edges = friends.map(
  (friend, index) =>
    new PersonFriendEdge({
      cursor: connectionBuilder.createCursor(friend.otherPerson, index),
      node: friend.otherPerson,
      createdAt: friend.createdAt,
    }),
);

// Return resolved PersonFriendConnection
return new PersonFriendConnection({
  pageInfo: connectionBuilder.createPageInfo({
    edges,
    totalEdges,
    hasNextPage: true,
    hasPreviousPage: false,
  }),
  edges,
});
```

### Customising Cursors

When using cursors for pagination of connections that allow the client to choose from different sorting options, you may
need to customise your cursor to reflect the chosen sort order. For example, if the client can sort `PersonConnection`
by either name or creation date, the cursors you create on each edge will need to be different. It is no use knowing the
creation date of the last node if you are trying to fetch the next page of edges after the name "Smith", and vice versa.

You _could_ set the node ID as the cursor in all cases and simply look up the relevant data (name or creation date) from
the node when given such a cursor. However, if you have a dataset that could change between requests then this approach
introduces the potential for odd behavior and/or missing results.

Imagine you have a `sortOption` field on your `PersonConnectionArgs` that determines the requested sort order:

```ts
@ArgsType()
export class PersonConnectionArgs extends ConnectionArgs {
  // In reality you might want an enum here, but we'll use a string for simplicity
  @Field(type => String, { nullable: true })
  public sortOption?: string;
}
```

You can customise your cursor based on the `sortOption` from the `ConnectionArgs` by changing your definition of
`createCursor` and `decodeCursor` in your builder class like the following example:

```ts
export class PersonConnectionBuilder extends ConnectionBuilder<
  PersonConnection,
  PersonConnectionArgs,
  PersonEdge,
  Person,
  PersonCursor
> {
  // ... (methods createConnection and createEdge remain unchanged)

  public createCursor(node: Person): PersonCursor {
    if (this.connectionArgs.sortOption === 'name') {
      return new Cursor({ name: node.name });
    }

    return new Cursor({ createdAt: node.createdAt.toISOString() });
  }

  public decodeCursor(encodedString: string): PersonCursor {
    if (this.connectionArgs.sortOption === 'name') {
      return Cursor.fromString(encodedString, params =>
        validateParamsUsingSchema(
          params,
          Joi.object({
            name: Joi.string().empty('').required(),
          }).unknown(false),
        ),
      );
    }

    return Cursor.fromString(encodedString, params =>
      validateParamsUsingSchema(
        params,
        Joi.object({
          id: Joi.string().empty('').required(),
        }).unknown(false),
      ),
    );
  }
}
```

Alternatively, `ConnectionBuilder` supports overriding the `createCursor()` method when calling `build()`. So you could
also do it like this:

```ts
import { Args, ResolveField, Resolver, Root } from '@nestjs/graphql';

@Resolver()
export class PersonQueryResolver {
  @Query(returns => PersonConnection)
  public async persons(@Args() connectionArgs: PersonConnectionArgs): Promise<PersonConnection> {
    const { sortOption } = connectionArgs;

    // Create builder instance
    const connectionBuilder = new PersonConnectionBuilder(connectionArgs);

    // EXAMPLE: Do whatever you need to do to fetch the current page of persons using the specified sort order
    const persons = await fetchPersons({
      where: { personId },
      order: sortOption === 'name' ? { name: 'ASC' } : { createdAt: 'ASC' },
      take: connectionBuilder.edgesPerPage, // how many rows to fetch
    });

    // Return resolved PersonConnection with edges and pageInfo
    return connectionBuilder.build({
      totalEdges: await countPersons(),
      nodes: persons,
      createCursor(node) {
        return new Cursor(sortOption === 'name' ? { name: node.name } : { createdAt: node.createdAt.toISOString() });
      },
    });
  }
}
```

## License

[MIT](LICENSE)
