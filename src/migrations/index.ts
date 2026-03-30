import * as migration_20260327_201402_add_team_member_fields from './20260327_201402_add_team_member_fields';
import * as migration_20260330_173657_add_media_attribution_fields from './20260330_173657_add_media_attribution_fields';

export const migrations = [
  {
    up: migration_20260327_201402_add_team_member_fields.up,
    down: migration_20260327_201402_add_team_member_fields.down,
    name: '20260327_201402_add_team_member_fields',
  },
  {
    up: migration_20260330_173657_add_media_attribution_fields.up,
    down: migration_20260330_173657_add_media_attribution_fields.down,
    name: '20260330_173657_add_media_attribution_fields'
  },
];
