import fetch from "node-fetch";
import * as APITypes from "./vaultSecretsAPI.js";

const API_ENDPOINT = "https://api.cloud.hashicorp.com/secrets/2023-06-13";

interface Token {
    accessToken: string,
    expiresIn: number,
    requestedAt: Date
}

async function getNewToken(clientID: string, clientSecret: string): Promise<Token> {
    const tokenRes = await fetch("https://auth.hashicorp.com/oauth/token",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "grant_type": "client_credentials",
                "client_id": `${clientID}`,
                "client_secret": `${clientSecret}`,
                audience: "https://api.hashicorp.cloud"
            })
        })

    if(tokenRes.status !== 200) {
        throw new Error("Failed to get token: " + await tokenRes.text());
    }

    const tokenData = await tokenRes.json() as APITypes.TokenRes;
    return {
        accessToken: tokenData.access_token,
        expiresIn: tokenData.expires_in,
        requestedAt: new Date()
    }
}


class NodeVaultDriver {
    private orgID: string;
    private projectID: string;
    private latestToken: Token;
    private appName?: string;

    constructor(orgID: string, projectID: string, token: Token, appName?: string) {
        this.orgID = orgID;
        this.projectID = projectID;
        this.appName = appName;
        this.latestToken = token;
    }

    private async getToken(): Promise<string> {
        if(this.latestToken) {
            const now = new Date();
            const expiresAt = new Date(this.latestToken.requestedAt.getTime() + this.latestToken.expiresIn * 1000);
            // In case the clock is off, we'll request a new token if we're within 5 seconds of the expiration
            if(now.getTime() + 5000 > expiresAt.getTime()) {
                return (await getNewToken(this.orgID, this.projectID)).accessToken;
            } else {
                return this.latestToken.accessToken;
            }
        }

        return (await getNewToken(this.orgID, this.projectID)).accessToken;
    }

    public setAppName(appName: string) {
        this.appName = appName;
    }

    public async getApplications(): Promise<APITypes.App[]> {
        const token = await this.getToken();
        const appRes = await fetch(`${API_ENDPOINT}/organizations/${this.orgID}/projects/${this.projectID}/apps`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        return (await appRes.json() as APITypes.AppRes).apps;
    }

    public async getSecretMetadata(): Promise<APITypes.SecretMetadata[]> {
        const token = await this.getToken();
        const appName = this.appName;
        
        if(!appName) {
            throw new Error("No app name set. Set it with .setAppName()");
        }
        
        const secretMetadataRes = await fetch(`${API_ENDPOINT}/organizations/${this.orgID}/projects/${this.projectID}/apps/${appName}/secrets`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        
        if(secretMetadataRes.status !== 200) {
            throw new Error("Failed to get secret metadata: " + await secretMetadataRes.text());
        }

        return (await secretMetadataRes.json() as APITypes.SecretMetadataRes).secrets;
    }

    public async getSecret(secretName: string, version?: string): Promise<APITypes.Secret | null> {
        const token = await this.getToken();
        const appName = this.appName;
        
        if(!appName) {
            throw new Error("No app name set. Set it with .setAppName()");
        }
        
        const secretRes = await fetch(`${API_ENDPOINT}/organizations/${this.orgID}/projects/${this.projectID}/apps/${appName}/open/${secretName}${version ? `/versions/${version}` : ""}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if(secretRes.status === 404) {
            return null;
        }

        if(secretRes.status !== 200) {
            throw new Error("Failed to get secret: " + await secretRes.text());
        }

        return (await secretRes.json() as APITypes.GetSecretRes).secret;
    }

    public async createSecret(secretName: string, value: string): Promise<APITypes.SecretMetadata> {
        const token = await this.getToken();
        const appName = this.appName;
        
        if(!appName) {
            throw new Error("No app name set. Set it with .setAppName()");
        }
        
        const secretRes = await fetch(`${API_ENDPOINT}/organizations/${this.orgID}/projects/${this.projectID}/apps/${appName}/kv`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: secretName,
                    value: value
                })
            }
        );

        if(secretRes.status === 403) {
            throw new Error("Not enough privileges to create secret. Does your service principal have Contributor role? " + await secretRes.text());
        }
        if(secretRes.status !== 200) {
            throw new Error("Failed to update secret: " + await secretRes.text());
        }

        return (await secretRes.json() as APITypes.CreateSecretRes).secret;
    }

    public async updateSecret(secretName: string, value: string): Promise<APITypes.SecretMetadata> {
        // It seems there's no distinction between creating and updating a secret
        return this.createSecret(secretName, value);
    }

    public async deleteSecret(secretName: string): Promise<void> {
        const token = await this.getToken();
        const appName = this.appName;
        
        if(!appName) {
            throw new Error("No app name set. Set it with .setAppName()");
        }
        
        const secretRes = await fetch(`${API_ENDPOINT}/organizations/${this.orgID}/projects/${this.projectID}/apps/${appName}/secrets/${secretName}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if(secretRes.status === 403) {
            throw new Error("Not enough privileges to delete secret. Does your service principal have Contributor role? " + await secretRes.text());
        }
        if(secretRes.status !== 200) {
            throw new Error("Failed to delete secret: " + await secretRes.text());
        }
    }
}

export async function connect(orgID: string, projectID: string, clientID: string, clientSecret: string, appName?: string) {
    const token = await getNewToken(clientID, clientSecret);
    return new NodeVaultDriver(orgID, projectID, token, appName);
}
