import { SetMetadata } from '@nestjs/common';
import type { OrgUserRole } from '@heimdall/contracts';

export const REQUIRE_PROJECT_ROLE_KEY = 'requireProjectRole';

export const RequireProjectRole = (...roles: OrgUserRole[]) =>
  SetMetadata(REQUIRE_PROJECT_ROLE_KEY, roles);
