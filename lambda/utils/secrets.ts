import { SecretsManager } from "aws-sdk";

import { LogUtil } from "./log";
import { Utils } from "../utils";

export class SecretsUtil {
  private _secrets?: SecretsManager;
  private readonly _cache: Partial<Record<string, string>> = {};

  constructor(public readonly log: LogUtil) {}

  private get secrets(): SecretsManager {
    if (this._secrets == null) {
      this._secrets = new SecretsManager();
    }
    return this._secrets;
  }

  private async cache(name: string, cb: () => Promise<string>): Promise<string> {
    if (this._cache[name] == null) {
      this._cache[name] = await cb();
    }
    return this._cache[name]!;
  }

  private async getSecret(arns: { dev: string; prod: string }): Promise<string> {
    const startTime = Date.now();
    const key = arns[Utils.getEnv()];
    const result = await this.secrets
      .getSecretValue({ SecretId: key })
      .promise()
      .then((s) => s.SecretString!);
    this.log.log("Secret:", key, ` - ${Date.now() - startTime}ms`);
    return result;
  }

  public async getCookieSecret(): Promise<string> {
    return this.cache("cookieSecret", () =>
      this.getSecret({
        dev: "arn:aws:secretsmanager:us-west-2:547433167554:secret:LftKeyCookieSecretDev-0eiLCe",
        prod: "arn:aws:secretsmanager:us-west-2:547433167554:secret:LftKeyCookieSecret-FwRXge",
      })
    );
  }

  public async getCryptoKey(): Promise<string> {
    return this.cache("cryptoKey", () =>
      this.getSecret({
        dev: "arn:aws:secretsmanager:us-west-2:547433167554:secret:lftCryptoKeyDev-qFcITJ",
        prod: "arn:aws:secretsmanager:us-west-2:547433167554:secret:lftCryptoKey-4Uxrea",
      })
    );
  }

  public async getApiKey(): Promise<string> {
    return this.cache("apiKey", () =>
      this.getSecret({
        dev: "arn:aws:secretsmanager:us-west-2:547433167554:secret:lftKeyApiKeyDev-JyFvUp",
        prod: "arn:aws:secretsmanager:us-west-2:547433167554:secret:lftKeyApiKey-rdTqST",
      })
    );
  }

  public async getWebpushrKey(): Promise<string> {
    return this.cache("webpushrKey", () =>
      this.getSecret({
        dev: "arn:aws:secretsmanager:us-west-2:547433167554:secret:LftKeyWebpushrKeyDev-OfWaEI",
        prod: "arn:aws:secretsmanager:us-west-2:547433167554:secret:LftKeyWebpushrKey-RrE8Yo",
      })
    );
  }

  public async getWebpushrAuthToken(): Promise<string> {
    return this.cache("webpushrAuthToken", () =>
      this.getSecret({
        dev: "arn:aws:secretsmanager:us-west-2:547433167554:secret:LftKeyWebpushrAuthTokenDev-Fa7AH9",
        prod: "arn:aws:secretsmanager:us-west-2:547433167554:secret:LftKeyWebpushrAuthToken-dxAKvR",
      })
    );
  }
}
