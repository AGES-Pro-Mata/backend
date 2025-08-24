import { Role } from '../roles/roles.decorator';

export const ROLE_MAP = {
  [Role.User]: new Set([Role.User]),
  [Role.Professor]: new Set([Role.User, Role.Professor]),
  [Role.Admin]: new Set([Role.Admin]),
  [Role.Root]: new Set([Role.Admin, Role.Root]),
};
