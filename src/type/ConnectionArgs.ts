import * as GQL from '@nestjs/graphql';
import * as Validate from 'class-validator';

@GQL.ArgsType()
export class ConnectionArgs {
  @Validate.IsInt()
  @Validate.Min(1)
  @Validate.IsOptional()
  @GQL.Field(_type => GQL.Int, {
    nullable: true,
    description: 'Retrieve page of edges by fixed offset page number.',
  })
  public page?: number | null;

  @Validate.IsString()
  @Validate.MinLength(1)
  @Validate.IsOptional()
  @GQL.Field(_type => String, {
    nullable: true,
    description: 'Retrieve page of edges before opaque cursor.',
  })
  public before?: string | null;

  @Validate.IsString()
  @Validate.MinLength(1)
  @Validate.IsOptional()
  @GQL.Field(_type => String, {
    nullable: true,
    description: 'Retrieve page of edges after opaque cursor.',
  })
  public after?: string | null;

  @Validate.IsInt()
  @Validate.Min(1)
  @Validate.IsOptional()
  @GQL.Field(_type => GQL.Int, {
    nullable: true,
    description: 'Retrieve first `n` edges.',
  })
  public first?: number | null;

  @Validate.IsInt()
  @Validate.Min(1)
  @Validate.IsOptional()
  @GQL.Field(_type => GQL.Int, {
    nullable: true,
    description: 'Retrieve last `n` edges.',
  })
  public last?: number | null;
}
