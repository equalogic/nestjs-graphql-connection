import * as Relay from 'graphql-relay';
import * as GQL from 'type-graphql';

@GQL.ObjectType()
export class PageInfo implements Relay.PageInfo {
  @GQL.Field()
  public hasNextPage!: boolean;

  @GQL.Field()
  public hasPreviousPage!: boolean;

  @GQL.Field({ nullable: true })
  public startCursor?: string | null;

  @GQL.Field({ nullable: true })
  public endCursor?: string | null;

  @GQL.Field(_type => GQL.Int, { nullable: true })
  public totalEdges?: number | null;
}
