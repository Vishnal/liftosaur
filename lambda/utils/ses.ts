import { SES } from "aws-sdk";
import { LogUtil } from "./log";

export class SesUtil {
  private _ses?: SES;

  constructor(public readonly log: LogUtil) {}

  private get ses(): SES {
    if (this._ses == null) {
      this._ses = new SES();
    }
    return this._ses;
  }

  public async sendEmail(args: {
    destination: string;
    source: string;
    subject: string;
    body: string;
  }): Promise<AWS.SES.Types.SendEmailResponse | undefined> {
    const startTime = Date.now();
    const result = await this.ses
      .sendEmail({
        Destination: { ToAddresses: [args.destination] },
        Source: args.source,
        Message: { Subject: { Data: args.subject }, Body: { Text: { Data: args.body } } },
      })
      .promise();
    this.log.log(`SES email '${args.subject}' to '${args.destination}' got sent - ${Date.now() - startTime}ms`);
    return result;
  }
}
