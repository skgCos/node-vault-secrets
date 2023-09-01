# Node Vault Secrets

A node.js driver for ***HCP Vault Secrets*** because I couldn't find an official one. Not to be confused with HCP Vault driver. 

As written on the HCP website the HCP Vault Secrets API is under active development and is subject to change. If the API changes, this driver won't work as expected anymore.

## Examples

### Initialize the driver
```ts
import nodeVaultSecrets from "node-vault-secrets";

// You can find these using the cli `vlt config`
// If you don't have the vault cli, download it following these instructions:
// https://developer.hashicorp.com/vault/tutorials/hcp-vault-secrets-get-started/hcp-vault-secrets-install-cli
const ORG_ID = "/../";
const APP_NAME = "/../";
const PROJECT_ID = "/../";

// These are the client id an secret of a service principal
// You can create one using the following guide:
// https://developer.hashicorp.com/hcp/docs/hcp/admin/iam/service-principals
const CLIENT_ID = "/../";
const CLIENT_SECRET = "/../";

const driver = await nodeVaultSecrets.connect(ORG_ID, PROJECT_ID, CLIENT_ID, CLIENT_SECRET);

// Optionally you can pass the app name if you would like so
const driver = await nodeVaultSecrets.connect(ORG_ID, PROJECT_ID, CLIENT_ID, CLIENT_SECRET, APP_NAME);
```

### Set the app name
This will set the app name for all future calls if you didn't pass it in the connect function
```ts
driver.setAppName(APP_NAME);
```

### List all secrets
This won't show any secret values, just information about the available secrets

```ts
const secretMetadata = await driver.getSecretMetadata();
```

### Get a secret
This will return the secret value or null if the secret doesn't exist.

```ts
const secret = await driver.getSecret(SECRET_NAME);
```

### Create a secret
This will create a secret with the given name and value. If the secret already exists it will be overwritten.

```ts
const updatedSecretMetadata = await driver.createSecret(SECRET_NAME, SECRET_VALUE);
```

### Delete a secret
This will delete a secret with the given name. If the secret doesn't exist it will do nothing.

```ts
driver.deleteSecret(SECRET_NAME);
```

## Extra

### List all the available applications
```ts
const applications = await driver.getApplications();
```
