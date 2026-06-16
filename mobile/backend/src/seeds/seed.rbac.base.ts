import "dotenv/config";
import mongoose from "mongoose";

import Permission from "../modules/rbac/models/permission.model";
import Role from "../modules/rbac/models/role.model";
import RolePermission from "../modules/rbac/models/rolePermission.model";

import {
  PERMISSION_META_LIST,
  DEFAULT_ROLE_PERMISSIONS,
} from "../constants/rbac.catalog";
import { SEED_ROLES } from "../constants/sendRoles";
import type { Role as RoleCode } from "../constants/roles";

async function main() {
  const uri = process.env.MONGO_DB_URL || process.env.MONGO_URI;
  if (!uri) throw new Error("Missing MONGO_DB_URL / MONGO_URI");

  await mongoose.connect(uri);
  console.log("Connected DB:", mongoose.connection.name);

  // 1. Seed permissions
  for (const meta of PERMISSION_META_LIST) {
    await Permission.updateOne(
      { key: meta.key },
      {
        $setOnInsert: {
          key: meta.key,
          resource: meta.resource,
          action: meta.action,
          label: meta.label,
          groupKey: meta.groupKey,
          groupLabel: meta.groupLabel,
          order: meta.order ?? 0,
          isActive: true,
        },
      },
      { upsert: true }
    );
  }

  console.log("Permissions seeded");

  // 2. Seed roles
  for (const role of SEED_ROLES) {
    await Role.updateOne(
      { code: role.code },
      {
        $setOnInsert: {
          code: role.code,
          type: role.type,
          priority: role.priority,
          isActive: true,
          isSystem: true,
        },
      },
      { upsert: true }
    );
  }

  console.log("Roles seeded");

  // 3. Seed role-permission
  for (const roleCode of Object.keys(DEFAULT_ROLE_PERMISSIONS) as RoleCode[]) {
    const role = await Role.findOne({ code: roleCode });
    if (!role) continue;

    let inserted = 0;

    for (const permissionKey of DEFAULT_ROLE_PERMISSIONS[roleCode]) {
      const res = await RolePermission.updateOne(
        {
          roleId: role._id,
          permissionKey,
        },
        {
          $setOnInsert: {
            roleId: role._id,
            permissionKey,
            scope: "all",
            field: null,
          },
        },
        { upsert: true }
      );

      if ((res as any).upsertedCount === 1) inserted++;
    }

    console.log(`RolePermission inserted for ${roleCode}: ${inserted}`);
  }

  await mongoose.disconnect();
  console.log("Done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
