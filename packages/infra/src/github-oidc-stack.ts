import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface GithubOidcStackProps extends cdk.StackProps {
  /** GitHub repository allowed to deploy, in "owner/name" form */
  githubRepo: string;
  /**
   * Set when the AWS account already has an OIDC provider for
   * token.actions.githubusercontent.com (an account can only have one per
   * URL), so the stack references it instead of creating another.
   */
  reuseExistingProvider?: boolean;
}

/**
 * One-time deployment prerequisites for the GitHub Actions deploy workflow:
 * the GitHub OIDC identity provider and an IAM role the workflow assumes.
 * Deployed by `pnpm run bootstrap` — not part of the application stack.
 */
export class GithubOidcStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: GithubOidcStackProps) {
    super(scope, id, props);

    const provider = props.reuseExistingProvider
      ? iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
          this,
          'GithubProvider',
          `arn:aws:iam::${this.account}:oidc-provider/token.actions.githubusercontent.com`
        )
      : new iam.OpenIdConnectProvider(this, 'GithubProvider', {
          url: 'https://token.actions.githubusercontent.com',
          clientIds: ['sts.amazonaws.com'],
        });

    const role = new iam.Role(this, 'DeployRole', {
      assumedBy: new iam.WebIdentityPrincipal(provider.openIdConnectProviderArn, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
        },
        StringLike: {
          'token.actions.githubusercontent.com:sub': `repo:${props.githubRepo}:*`,
        },
      }),
      description: `GitHub Actions deploy role for ${props.githubRepo}`,
    });

    // CDK performs the actual deployment by assuming its bootstrap roles,
    // so the workflow role only needs permission to assume them.
    role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['sts:AssumeRole'],
        resources: [`arn:aws:iam::${this.account}:role/cdk-*`],
      })
    );

    // The deploy workflow reads the deployed stack's outputs directly to
    // inject them into the frontend build.
    role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['cloudformation:DescribeStacks'],
        resources: [
          this.formatArn({
            service: 'cloudformation',
            resource: 'stack',
            resourceName: 'SaasStack/*',
            arnFormat: cdk.ArnFormat.SLASH_RESOURCE_NAME,
          }),
        ],
      })
    );

    new cdk.CfnOutput(this, 'DeployRoleArn', { value: role.roleArn });
  }
}
