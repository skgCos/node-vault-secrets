import nodeVaultSecrets from "../src/index.js";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import tsInterfaceChecker from "ts-interface-checker";
import APITypesTI from "../src/vaultSecretsAPI-ti.js";

chai.use(chaiAsPromised);
const assert = chai.assert;

const interfaceCheckers = tsInterfaceChecker.createCheckers(APITypesTI)

const ORG_ID = process.env.ORG_ID || "not set";
const APP_NAME = process.env.APP_NAME || "not set";
const PROJECT_ID = process.env.PROJECT_ID || "not set";
const CLIENT_ID = process.env.CLIENT_ID || "not set";
const CLIENT_SECRET = process.env.CLIENT_SECRET || "not set";
const SECRET_NAME = process.env.SECRET_NAME || "not set";

describe(".connect", function() {
    it("should not reject the promise when it connects to vault secrets", async function() {
        assert.isFulfilled(nodeVaultSecrets.connect(ORG_ID, PROJECT_ID, CLIENT_ID, CLIENT_SECRET));
    });

    it("should reject the promise when it connects to vault secrets with wrong credentials", async function() {
        assert.isRejected(nodeVaultSecrets.connect(ORG_ID, PROJECT_ID, CLIENT_ID, "wrong"));
    });
});

describe("VaultSecretDriver.getApplications", function() {
    it("should be an array containing all the expected properties", async function() {
        const driver = await nodeVaultSecrets.connect(ORG_ID, PROJECT_ID, CLIENT_ID, CLIENT_SECRET);
        const result = await driver.getApplications();
        
        assert.isArray(result);
        assert.isObject(result[0]);

        assert.doesNotThrow(() => interfaceCheckers.App.check(result[0]));
    });
});

describe("VaultSecretDriver.getSecretMetadata", function() {
    it("should not work if the app name is not set", async function() {
        const driver = await nodeVaultSecrets.connect(ORG_ID, PROJECT_ID, CLIENT_ID, CLIENT_SECRET);
        assert.isRejected(driver.getSecretMetadata());
    });

    it("the result of getSecretMetadata should be an array containing all the expected properties", async function() {
        const driver = await nodeVaultSecrets.connect(ORG_ID, PROJECT_ID, CLIENT_ID, CLIENT_SECRET, APP_NAME);
        const result = await driver.getSecretMetadata();
        
        assert.isArray(result);
        assert.isObject(result[0]);

        assert.doesNotThrow(() => interfaceCheckers.SecretMetadata.check(result[0]));
    });
});

describe("VaultSecretDriver.getSecret", function() {
    it("should not work if the app name is not set", async function() {
        const driver = await nodeVaultSecrets.connect(ORG_ID, PROJECT_ID, CLIENT_ID, CLIENT_SECRET);
        assert.isRejected(driver.getSecret(SECRET_NAME));
    });

    it("should return null if the secret does not exist", async function() {
        const driver = await nodeVaultSecrets.connect(ORG_ID, PROJECT_ID, CLIENT_ID, CLIENT_SECRET, APP_NAME);
        const result = await driver.getSecret("doesnotexist");
        assert.isNull(result);
    });

    it("the result of getSecret should be an object containing all the expected properties", async function() {
        const driver = await nodeVaultSecrets.connect(ORG_ID, PROJECT_ID, CLIENT_ID, CLIENT_SECRET, APP_NAME);
        const result = await driver.getSecret(SECRET_NAME);
        
        assert.isObject(result);
        assert.doesNotThrow(() => interfaceCheckers.Secret.check(result));
    });
});

describe("VaultSecretDriver.createSecret", function() {
    it("should not work if the app name is not set", async function() {
        const driver = await nodeVaultSecrets.connect(ORG_ID, PROJECT_ID, CLIENT_ID, CLIENT_SECRET);
        assert.isRejected(driver.createSecret(SECRET_NAME, "value"));
    });

    it("should create a secret", async function() {
        const driver = await nodeVaultSecrets.connect(ORG_ID, PROJECT_ID, CLIENT_ID, CLIENT_SECRET, APP_NAME);
        const result = await driver.createSecret(SECRET_NAME, "value");

        assert.isObject(result);
        assert.doesNotThrow(() => interfaceCheckers.SecretMetadata.check(result));
    });
});

describe("VaultSecretDriver.updateSecret", function() {
    it("should not work if the app name is not set", async function() {
        const driver = await nodeVaultSecrets.connect(ORG_ID, PROJECT_ID, CLIENT_ID, CLIENT_SECRET);
        assert.isRejected(driver.updateSecret(SECRET_NAME, "value"));
    });

    it("should update a secret", async function() {
        const driver = await nodeVaultSecrets.connect(ORG_ID, PROJECT_ID, CLIENT_ID, CLIENT_SECRET, APP_NAME);
        const result = await driver.updateSecret(SECRET_NAME, "value");

        assert.isObject(result);
        assert.doesNotThrow(() => interfaceCheckers.SecretMetadata.check(result));
    });
});

describe("VaultSecretDriver.deleteSecret", function() {
    it("should not work if the app name is not set", async function() {
        const driver = await nodeVaultSecrets.connect(ORG_ID, PROJECT_ID, CLIENT_ID, CLIENT_SECRET);
        assert.isRejected(driver.deleteSecret(SECRET_NAME));
    });

    it("should delete a secret", async function() {
        const driver = await nodeVaultSecrets.connect(ORG_ID, PROJECT_ID, CLIENT_ID, CLIENT_SECRET, APP_NAME);
        
        const tmpSecretName = "toBeDeleted";
        await driver.createSecret(tmpSecretName, "value");
        await driver.deleteSecret(tmpSecretName);
        
        const result = await driver.getSecretMetadata();
        assert.isEmpty(result.filter((secret) => secret.name === tmpSecretName));
    });
});
