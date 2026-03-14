// src/modules/role/role.types.ts

export type RoleType = "admin" | "manager" | "staff" | "user" | "guest";

export type RoleCreatePayload = {
    code: string;
    name?: string;
    description?: string;
    type?: RoleType;
    priority?: number;
    isActive?: boolean;
};