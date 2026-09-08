import * as migration_20260327_201402_add_team_member_fields from './20260327_201402_add_team_member_fields';
import * as migration_20260330_173657_add_media_attribution_fields from './20260330_173657_add_media_attribution_fields';
import * as migration_20260331_213356_crm_tables from './20260331_213356_crm_tables';
import * as migration_20260406_105300_add_market_areas_status from './20260406_105300_add_market_areas_status';
import * as migration_20260827_120000_add_users_sub_for_sso from './20260827_120000_add_users_sub_for_sso';
import * as migration_20260904_120000_add_posts_source_url from './20260904_120000_add_posts_source_url';

export const migrations = [
  {
    up: migration_20260327_201402_add_team_member_fields.up,
    down: migration_20260327_201402_add_team_member_fields.down,
    name: '20260327_201402_add_team_member_fields',
  },
  {
    up: migration_20260330_173657_add_media_attribution_fields.up,
    down: migration_20260330_173657_add_media_attribution_fields.down,
    name: '20260330_173657_add_media_attribution_fields',
  },
  {
    up: migration_20260331_213356_crm_tables.up,
    down: migration_20260331_213356_crm_tables.down,
    name: '20260331_213356_crm_tables',
  },
  {
    up: migration_20260406_105300_add_market_areas_status.up,
    down: migration_20260406_105300_add_market_areas_status.down,
    name: '20260406_105300_add_market_areas_status',
  },
  {
    up: migration_20260827_120000_add_users_sub_for_sso.up,
    down: migration_20260827_120000_add_users_sub_for_sso.down,
    name: '20260827_120000_add_users_sub_for_sso',
  },
  {
    up: migration_20260904_120000_add_posts_source_url.up,
    down: migration_20260904_120000_add_posts_source_url.down,
    name: '20260904_120000_add_posts_source_url',
  },
];
