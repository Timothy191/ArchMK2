import { createServiceRoleClient } from "@repo/supabase/service-role";

export function createServiceRoleMutation() {
  return createServiceRoleClient();
}
