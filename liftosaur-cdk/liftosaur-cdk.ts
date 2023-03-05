import * as cdk from "@aws-cdk/core";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigw from "@aws-cdk/aws-apigateway";
import * as sm from "@aws-cdk/aws-secretsmanager";
import * as s3 from "@aws-cdk/aws-s3";
import * as acm from "@aws-cdk/aws-certificatemanager";
import * as iam from "@aws-cdk/aws-iam";

export class LiftosaurCdkStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, isDev: boolean, props?: cdk.StackProps) {
    super(scope, id, props);

    const suffix = isDev ? "Dev" : "";
    const env = isDev ? "dev" : "prod";

    const depsLayer = new lambda.LayerVersion(this, `LftNodeDependencies${suffix}`, {
      code: lambda.Code.fromAsset("dist-lambda", {
        bundling: {
          image: lambda.Runtime.NODEJS_16_X.bundlingDockerImage,
          command: [
            "bash",
            "-c",
            "mkdir -p /asset-output/nodejs && cd /asset-output/nodejs && cp /asset-input/{package.json,package-lock.json} . && npm ci",
          ],
          environment: { HOME: "/tmp/home" },
        },
      }),
    });

    const usersTable = new dynamodb.Table(this, `LftUsers${suffix}`, {
      tableName: `lftUsers${suffix}`,
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
    });
    usersTable.addGlobalSecondaryIndex({
      indexName: `lftUsersGoogleId${suffix}`,
      partitionKey: { name: "googleId", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    usersTable.addGlobalSecondaryIndex({
      indexName: `lftUsersAppleId${suffix}`,
      partitionKey: { name: "appleId", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    usersTable.addGlobalSecondaryIndex({
      indexName: `lftUsersNickname${suffix}`,
      partitionKey: { name: "nickname", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const friendsTable = new dynamodb.Table(this, `LftFriendsStatuses${suffix}`, {
      tableName: `lftFriendsStatuses${suffix}`,
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "friendId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
    });

    const affiliatesTable = new dynamodb.Table(this, `LftAffiliates${suffix}`, {
      tableName: `lftAffiliates${suffix}`,
      partitionKey: { name: "affiliateId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
    });

    const googleAuthKeysTable = new dynamodb.Table(this, `LftGoogleAuthKeys${suffix}`, {
      tableName: `lftGoogleAuthKeys${suffix}`,
      partitionKey: { name: "token", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
    });

    const appleAuthKeysTable = new dynamodb.Table(this, `LftAppleAuthKeys${suffix}`, {
      tableName: `lftAppleAuthKeys${suffix}`,
      partitionKey: { name: "token", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
    });

    const historyRecordsTable = new dynamodb.Table(this, `LftHistoryRecords${suffix}`, {
      tableName: `lftHistoryRecords${suffix}`,
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "id", type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
    });
    historyRecordsTable.addGlobalSecondaryIndex({
      indexName: `lftHistoryRecordsDate${suffix}`,
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "date", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    historyRecordsTable.addGlobalSecondaryIndex({
      indexName: `lftHistoryRecordsTimestamp${suffix}`,
      partitionKey: { name: "endTime", type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const statsTable = new dynamodb.Table(this, `LftStats${suffix}`, {
      tableName: `lftStats${suffix}`,
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "name", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
    });
    statsTable.addGlobalSecondaryIndex({
      indexName: `lftStatsTimestamp${suffix}`,
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const logsTable = new dynamodb.Table(this, `LftLogs${suffix}`, {
      tableName: `lftLogs${suffix}`,
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "action", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const userProgramsTable = new dynamodb.Table(this, `LftUserPrograms${suffix}`, {
      tableName: `lftUserPrograms${suffix}`,
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
    });

    const programsTable = new dynamodb.Table(this, `LftPrograms${suffix}`, {
      tableName: `lftPrograms${suffix}`,
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
    });

    const commentsTable = new dynamodb.Table(this, `LftComments${suffix}`, {
      tableName: `lftComments${suffix}`,
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
    });
    commentsTable.addGlobalSecondaryIndex({
      indexName: `lftCommentsFriends${suffix}`,
      partitionKey: { name: "friendId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "id", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const likesTable = new dynamodb.Table(this, `LftLikes${suffix}`, {
      tableName: `lftLikes${suffix}`,
      partitionKey: { name: "friendIdHistoryRecordId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
    });
    likesTable.addGlobalSecondaryIndex({
      indexName: `lftLikesFriends${suffix}`,
      partitionKey: { name: "friendId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    likesTable.addGlobalSecondaryIndex({
      indexName: `lftLikesUsers${suffix}`,
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const urlsTable = new dynamodb.Table(this, `LftUrls${suffix}`, {
      tableName: `lftUrls${suffix}`,
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
    });

    const secretArns = {
      dev: {
        apiKey: "arn:aws:secretsmanager:us-west-2:547433167554:secret:lftKeyApiKeyDev-JyFvUp",
        cookieSecret: "arn:aws:secretsmanager:us-west-2:547433167554:secret:LftKeyCookieSecretDev-0eiLCe",
        webpushrKey: "arn:aws:secretsmanager:us-west-2:547433167554:secret:LftKeyWebpushrKeyDev-OfWaEI",
        webpushrAuthToken: "arn:aws:secretsmanager:us-west-2:547433167554:secret:LftKeyWebpushrAuthTokenDev-Fa7AH9",
        cryptoKey: "arn:aws:secretsmanager:us-west-2:547433167554:secret:lftCryptoKeyDev-qFcITJ",
        appleAppSharedSecret: "arn:aws:secretsmanager:us-west-2:547433167554:secret:lftAppleAppSharedSecret-hDZrTa",
        googleServiceAccountPubsub:
          "arn:aws:secretsmanager:us-west-2:547433167554:secret:lftGoogleServiceAccountPubsub-6YyK94",
      },
      prod: {
        apiKey: "arn:aws:secretsmanager:us-west-2:547433167554:secret:lftKeyApiKey-rdTqST",
        cookieSecret: "arn:aws:secretsmanager:us-west-2:547433167554:secret:LftKeyCookieSecret-FwRXge",
        webpushrKey: "arn:aws:secretsmanager:us-west-2:547433167554:secret:LftKeyWebpushrKey-RrE8Yo",
        webpushrAuthToken: "arn:aws:secretsmanager:us-west-2:547433167554:secret:LftKeyWebpushrAuthToken-dxAKvR",
        cryptoKey: "arn:aws:secretsmanager:us-west-2:547433167554:secret:lftCryptoKey-4Uxrea",
        appleAppSharedSecret: "arn:aws:secretsmanager:us-west-2:547433167554:secret:lftAppleAppSharedSecret-hDZrTa",
        googleServiceAccountPubsub:
          "arn:aws:secretsmanager:us-west-2:547433167554:secret:lftGoogleServiceAccountPubsub-6YyK94",
      },
    };

    const keyCookieSecret = sm.Secret.fromSecretAttributes(this, `LftKeyCookieSecret${suffix}`, {
      secretCompleteArn: secretArns[env].cookieSecret,
    });
    const keyApiKey = sm.Secret.fromSecretAttributes(this, `LftKeyApiKey${suffix}`, {
      secretCompleteArn: secretArns[env].apiKey,
    });
    const webpushrKey = sm.Secret.fromSecretAttributes(this, `LftWebpushrKey${suffix}`, {
      secretCompleteArn: secretArns[env].webpushrKey,
    });
    const webpushrAuthToken = sm.Secret.fromSecretAttributes(this, `LftWebpushrAuthToken${suffix}`, {
      secretCompleteArn: secretArns[env].webpushrAuthToken,
    });
    const cryptoKeySecret = sm.Secret.fromSecretAttributes(this, `lftCryptoKey${suffix}`, {
      secretCompleteArn: secretArns[env].cryptoKey,
    });
    const appleAppSharedSecret = sm.Secret.fromSecretAttributes(this, `lftAppleAppSharedSecret${suffix}`, {
      secretCompleteArn: secretArns[env].appleAppSharedSecret,
    });
    const googleServiceAccountPubsub = sm.Secret.fromSecretAttributes(this, `lftGoogleServiceAccountPubsub${suffix}`, {
      secretCompleteArn: secretArns[env].googleServiceAccountPubsub,
    });

    const bucket = new s3.Bucket(this, `LftS3Caches${suffix}`, {
      bucketName: `liftosaurcaches${suffix.toLowerCase()}`,
      lifecycleRules: [{ expiration: cdk.Duration.days(1) }],
    });

    const lambdaFunction = new lambda.Function(this, `LftLambda${suffix}`, {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset("dist-lambda"),
      memorySize: 2048,
      layers: [depsLayer],
      timeout: cdk.Duration.seconds(isDev ? 120 : 60),
      handler: "lambda/index.handler",
      environment: {
        IS_DEV: `${isDev}`,
      },
    });

    const cert = acm.Certificate.fromCertificateArn(
      this,
      `LftEndpointCert${suffix}`,
      "arn:aws:acm:us-west-2:547433167554:certificate/9b0ad338-9f91-45c0-9cd6-5ba854748035"
    );

    const restApi = new apigw.RestApi(this, `LftEndpoint${suffix}`, {
      defaultIntegration: new apigw.LambdaIntegration(lambdaFunction),
      binaryMediaTypes: ["*/*"],
      domainName: {
        domainName: `api2${isDev ? "-dev" : ""}.liftosaur.com`,
        certificate: cert,
      },
    });
    restApi.root.addProxy();

    bucket.grantReadWrite(lambdaFunction);
    keyCookieSecret.grantRead(lambdaFunction);
    keyApiKey.grantRead(lambdaFunction);
    webpushrKey.grantRead(lambdaFunction);
    webpushrAuthToken.grantRead(lambdaFunction);
    cryptoKeySecret.grantRead(lambdaFunction);
    appleAppSharedSecret.grantRead(lambdaFunction);
    googleServiceAccountPubsub.grantRead(lambdaFunction);
    usersTable.grantReadWriteData(lambdaFunction);
    googleAuthKeysTable.grantReadWriteData(lambdaFunction);
    appleAuthKeysTable.grantReadWriteData(lambdaFunction);
    historyRecordsTable.grantReadWriteData(lambdaFunction);
    statsTable.grantReadWriteData(lambdaFunction);
    programsTable.grantReadWriteData(lambdaFunction);
    userProgramsTable.grantReadWriteData(lambdaFunction);
    logsTable.grantReadWriteData(lambdaFunction);
    friendsTable.grantReadWriteData(lambdaFunction);
    commentsTable.grantReadWriteData(lambdaFunction);
    likesTable.grantReadWriteData(lambdaFunction);
    urlsTable.grantReadWriteData(lambdaFunction);
    affiliatesTable.grantReadWriteData(lambdaFunction);
    lambdaFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ses:SendEmail", "SES:SendRawEmail"],
        resources: ["*"],
        effect: iam.Effect.ALLOW,
      })
    );
  }
}

const app = new cdk.App();
new LiftosaurCdkStack(app, "LiftosaurStackDev", true);
// new LiftosaurCdkStack(app, "LiftosaurStack", false);
