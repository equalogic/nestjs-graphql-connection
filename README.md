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

  // EXAMPLE: Defining a custom argument for filtering
  @Field(type => ID, { nullable: true })
  public personId?: string;
}
```

### Create a Connection Builder

Now define a `ConnectionBuilder` class for your `Connection` object. The builder is responsible for interpreting
pagination arguments for the connection, and creating the cursors and `Edge` objects that make up the connection.

```ts
import { ConnectionBuilder, Cursor, PageInfo, validateCursorParameters } from 'nestjs-graphql-connection';

export type PersonCursorParams = { id: string };
export type PersonCursor = Cursor<PersonCursorParams>;

export class PersonConnectionBuilder extends ConnectionBuilder<PersonConnection, PersonEdge, Person, PersonCursor> {
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

    return Cursor.fromString(encodedString, params => validateCursorParameters(params, schema));
  }
}
```

#### Using Offset Pagination

With offset pagination, cursor values are an encoded representation of the row offset. It is possible for clients to
paginate by specifying either an `after` argument with the cursor of the last row on the previous page, or to pass a
`page` argument with an explicit page number (based on the rows per page set by the `first` argument).

(TODO)

### Return a Connection from a Query Resolver

Your resolvers can return a `Connection` as an object type. Use your `ConnectionBuilder` class to determine which page
of results to fetch and to create `PageInfo`, cursors, and edges in the result.

```ts
import { Query, Resolver } from '@nestjs/graphql';

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
