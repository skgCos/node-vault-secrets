var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fetch from "node-fetch";
const API_ENDPOINT = "https://api.cloud.hashicorp.com/secrets/2023-06-13";
function getNewToken(clientID, clientSecret) {
    return __awaiter(this, void 0, void 0, function* () {
        const tokenRes = yield fetch("https://auth.hashicorp.com/oauth/token", {
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
        });
        if (tokenRes.status !== 200) {
            throw new Error("Failed to get token: " + (yield tokenRes.text()));
        }
        const tokenData = yield tokenRes.json();
        return {
            accessToken: tokenData.access_token,
            expiresIn: tokenData.expires_in,
            requestedAt: new Date()
        };
    });
}
class NodeVaultDriver {
    constructor(orgID, projectID, token, appName) {
        this.orgID = orgID;
        this.projectID = projectID;
        this.appName = appName;
        this.latestToken = token;
    }
    getToken() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.latestToken) {
                const now = new Date();
                const expiresAt = new Date(this.latestToken.requestedAt.getTime() + this.latestToken.expiresIn * 1000);
                // In case the clock is off, we'll request a new token if we're within 5 seconds of the expiration
                if (now.getTime() + 5000 > expiresAt.getTime()) {
                    return (yield getNewToken(this.orgID, this.projectID)).accessToken;
                }
                else {
                    return this.latestToken.accessToken;
                }
            }
            return (yield getNewToken(this.orgID, this.projectID)).accessToken;
        });
    }
    setAppName(appName) {
        this.appName = appName;
    }
    getApplications() {
        return __awaiter(this, void 0, void 0, function* () {
            const token = yield this.getToken();
            const appRes = yield fetch(`${API_ENDPOINT}/organizations/${this.orgID}/projects/${this.projectID}/apps`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return (yield appRes.json()).apps;
        });
    }
    getSecretMetadata() {
        return __awaiter(this, void 0, void 0, function* () {
            const token = yield this.getToken();
            const appName = this.appName;
            if (!appName) {
                throw new Error("No app name set. Set it with .setAppName()");
            }
            const secretMetadataRes = yield fetch(`${API_ENDPOINT}/organizations/${this.orgID}/projects/${this.projectID}/apps/${appName}/secrets`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (secretMetadataRes.status !== 200) {
                throw new Error("Failed to get secret metadata: " + (yield secretMetadataRes.text()));
            }
            return (yield secretMetadataRes.json()).secrets;
        });
    }
    getSecret(secretName, version) {
        return __awaiter(this, void 0, void 0, function* () {
            const token = yield this.getToken();
            const appName = this.appName;
            if (!appName) {
                throw new Error("No app name set. Set it with .setAppName()");
            }
            const secretRes = yield fetch(`${API_ENDPOINT}/organizations/${this.orgID}/projects/${this.projectID}/apps/${appName}/open/${secretName}${version ? `/versions/${version}` : ""}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (secretRes.status === 404) {
                return null;
            }
            if (secretRes.status !== 200) {
                throw new Error("Failed to get secret: " + (yield secretRes.text()));
            }
            return (yield secretRes.json()).secret;
        });
    }
    createSecret(secretName, value) {
        return __awaiter(this, void 0, void 0, function* () {
            const token = yield this.getToken();
            const appName = this.appName;
            if (!appName) {
                throw new Error("No app name set. Set it with .setAppName()");
            }
            const secretRes = yield fetch(`${API_ENDPOINT}/organizations/${this.orgID}/projects/${this.projectID}/apps/${appName}/kv`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: secretName,
                    value: value
                })
            });
            if (secretRes.status === 403) {
                throw new Error("Not enough privileges to create secret. Does your service principal have Contributor role? " + (yield secretRes.text()));
            }
            if (secretRes.status !== 200) {
                throw new Error("Failed to update secret: " + (yield secretRes.text()));
            }
            return (yield secretRes.json()).secret;
        });
    }
    updateSecret(secretName, value) {
        return __awaiter(this, void 0, void 0, function* () {
            // It seems there's no distinction between creating and updating a secret
            return this.createSecret(secretName, value);
        });
    }
    deleteSecret(secretName) {
        return __awaiter(this, void 0, void 0, function* () {
            const token = yield this.getToken();
            const appName = this.appName;
            if (!appName) {
                throw new Error("No app name set. Set it with .setAppName()");
            }
            const secretRes = yield fetch(`${API_ENDPOINT}/organizations/${this.orgID}/projects/${this.projectID}/apps/${appName}/secrets/${secretName}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (secretRes.status === 403) {
                throw new Error("Not enough privileges to delete secret. Does your service principal have Contributor role? " + (yield secretRes.text()));
            }
            if (secretRes.status !== 200) {
                throw new Error("Failed to delete secret: " + (yield secretRes.text()));
            }
        });
    }
}
export function connect(orgID, projectID, clientID, clientSecret, appName) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = yield getNewToken(clientID, clientSecret);
        return new NodeVaultDriver(orgID, projectID, token, appName);
    });
}
//# sourceMappingURL=lib.js.map