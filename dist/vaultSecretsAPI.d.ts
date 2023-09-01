export interface Location {
    organization_id: string;
    project_id: string;
    region: string | null;
}
export interface CreatedBy {
    name: string;
    type: "TYPE_USER" | "TYPE_SERVICE";
    email: string;
}
export interface App {
    location: Location;
    name: string;
    created_at: string;
    updated_at: string | null;
    description: string;
    created_by: CreatedBy;
    updated_by: CreatedBy | null;
    sync_integrations: any[];
}
export interface VersionMetadata {
    version: string;
    type: "kv";
    created_at: string;
    created_by: CreatedBy;
}
export interface SecretMetadata {
    name: string;
    version: VersionMetadata;
    created_at: string;
    latest_version: string;
    created_by: CreatedBy;
    sync_status: any;
}
export interface VersionSecret {
    version: string;
    type: "kv";
    created_at: string;
    created_by: CreatedBy;
    value: string;
}
export interface Secret {
    name: string;
    version: VersionSecret;
    created_at: string;
    latest_version: string;
    created_by: CreatedBy;
    sync_status: any;
}
export interface TokenRes {
    access_token: string;
    expires_in: number;
    token_type: string;
}
export interface AppRes {
    apps: App[];
}
export interface SecretMetadataRes {
    secrets: SecretMetadata[];
}
export interface GetSecretRes {
    secret: Secret;
}
export type CreateSecretRes = {
    secret: SecretMetadata;
};
