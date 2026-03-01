import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Database } from './constructs/database';
import { Auth } from './constructs/auth';
import { Api } from './constructs/api';
import { Frontend } from './constructs/frontend';

export class SaasStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const database = new Database(this, 'Database');
    const auth = new Auth(this, 'Auth');

    const api = new Api(this, 'Api', {
      table: database.table,
      userPool: auth.userPool,
      userPoolClient: auth.userPoolClient,
    });

    const frontend = new Frontend(this, 'Frontend', {
      apiUrl: api.httpApi.url!,
      userPoolId: auth.userPool.userPoolId,
      userPoolClientId: auth.userPoolClient.userPoolClientId,
    });

    new cdk.CfnOutput(this, 'TableName', { value: database.table.tableName });
    new cdk.CfnOutput(this, 'UserPoolId', { value: auth.userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: auth.userPoolClient.userPoolClientId,
    });
    new cdk.CfnOutput(this, 'ApiUrl', { value: api.httpApi.url! });
    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: `https://${frontend.distribution.distributionDomainName}`,
    });
  }
}
