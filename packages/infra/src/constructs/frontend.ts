import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';
import * as path from 'path';

interface FrontendProps {
  apiUrl: string;
  userPoolId: string;
  userPoolClientId: string;
}

export class Frontend extends Construct {
  public readonly distribution: cloudfront.Distribution;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(scope: Construct, id: string, props: FrontendProps) {
    super(scope, id);

    const outputPath = path.join(__dirname, '../../../../apps/web/out');

    // S3 bucket for static site hosting
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const s3Origin = origins.S3BucketOrigin.withOriginAccessControl(siteBucket);

    // next export emits one .html file per route (e.g. projects.html), not
    // directory/index.html pairs, so extensionless requests like /projects
    // 404 at the origin unless rewritten to /projects.html first.
    const appendHtmlFunction = new cloudfront.Function(this, 'AppendHtmlFunction', {
      code: cloudfront.FunctionCode.fromInline(`
        function handler(event) {
          var request = event.request;
          var uri = request.uri;

          if (uri.endsWith('/')) {
            uri += 'index.html';
          } else if (!uri.includes('.')) {
            uri += '.html';
          }

          request.uri = uri;
          return request;
        }
      `),
      runtime: cloudfront.FunctionRuntime.JS_2_0,
    });

    // CloudFront distribution
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: s3Origin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        functionAssociations: [
          {
            function: appendHtmlFunction,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 404,
          responsePagePath: '/404.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: '/404.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
    });

    // Deploy static assets to S3
    new s3deploy.BucketDeployment(this, 'DeployAssets', {
      sources: [s3deploy.Source.asset(outputPath)],
      destinationBucket: siteBucket,
      distribution: this.distribution,
      distributionPaths: ['/*'],
    });
  }
}
