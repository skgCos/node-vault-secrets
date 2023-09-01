import * as APITypes from "./vaultSecretsAPI.js";
interface Token {
    accessToken: string;
    expiresIn: number;
    requestedAt: Date;
}
declare class NodeVaultDriver {
    private orgID;
    private projectID;
    private latestToken;
    private appName?;
    constructor(orgID: string, projectID: string, token: Token, appName?: string);
    private getToken;
    setAppName(appName: string): void;
    getApplications(): Promise<APITypes.App[]>;
    getSecretMetadata(): Promise<APITypes.SecretMetadata[]>;
    getSecret(secretName: string, version?: string): Promise<APITypes.Secret | null>;
    createSecret(secretName: string, value: string): Promise<APITypes.SecretMetadata>;
    updateSecret(secretName: string, value: string): Promise<APITypes.SecretMetadata>;
    deleteSecret(secretName: string): Promise<void>;
}
export declare function connect(orgID: string, projectID: string, clientID: string, clientSecret: string, appName?: string): Promise<NodeVaultDriver>;
export {};
