import * as GQL from 'type-graphql';

@GQL.ArgsType()
export class ConnectionArgs {
  @GQL.Field(_type => String, {
    nullable: true,
    description: 'Retrieve page of edges before opaque cursor.',
  })
  public before?: string;

  @GQL.Field(_type => String, {
    nullable: true,
    description: 'Retrieve page of edges after opaque cursor.',
  })
  public after?: string;

  @GQL.Field(_type => GQL.Int, {
    nullable: true,
    description: 'Retrieve first `n` edges.',
  })
  public first?: number;

  @GQL.Field(_type => GQL.Int, {
    nullable: true,
    description: 'Retrieve last `n` edges.',
  })
  public last?: number;
}
