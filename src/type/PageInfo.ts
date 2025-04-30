import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PageInfo {
  @Field(_type => Boolean)
  public hasNextPage!: boolean;

  @Field(_type => Boolean)
  public hasPreviousPage!: boolean;

  @Field(_type => String, { nullable: true })
  public startCursor: string | null;

  @Field(_type => String, { nullable: true })
  public endCursor: string | null;

  @Field(_type => Int, { nullable: true })
  public totalEdges?: number | null;
}
