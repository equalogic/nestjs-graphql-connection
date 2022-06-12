import * as GQL from '@nestjs/graphql';

@GQL.ObjectType()
export class PageInfo {
  @GQL.Field(_type => Boolean)
  public hasNextPage!: boolean;

  @GQL.Field(_type => Boolean)
  public hasPreviousPage!: boolean;

  @GQL.Field(_type => String, { nullable: true })
  public startCursor: string | null;

  @GQL.Field(_type => String, { nullable: true })
  public endCursor: string | null;

  @GQL.Field(_type => GQL.Int, { nullable: true })
  public totalEdges?: number | null;
}
