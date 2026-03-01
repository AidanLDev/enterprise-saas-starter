import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as lambda from 'aws-cdk-lib/aws-lambda';
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

  constructor(scope: Construct, id: string, props: FrontendProps) {
    super(scope, id);

    const openNextOutputPath = path.join(__dirname, '../../../../apps/web/.open-next');

    // S3 bucket for static assets
    const assetsBucket = new s3.Bucket(this, 'AssetsBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Server function Lambda (SSR + API routes)
    const serverFunction = new lambda.Function(this, 'ServerFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(openNextOutputPath, 'server-function', 'default')),
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        API_URL: props.apiUrl,
        USER_POOL_ID: props.userPoolId,
        USER_POOL_CLIENT_ID: props.userPoolClientId,
      },
    });

    // Function URL for CloudFront origin (cheaper than API Gateway for this use case)
    const serverFunctionUrl = serverFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    // Image optimization function
    const imageFunction = new lambda.Function(this, 'ImageFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(openNextOutputPath, 'image-optimization-function')),
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        BUCKET_NAME: assetsBucket.bucketName,
      },
    });

    assetsBucket.grantRead(imageFunction);

    const imageFunctionUrl = imageFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    // CloudFront distribution
    const serverOrigin = new origins.FunctionUrlOrigin(serverFunctionUrl);
    const imageOrigin = new origins.FunctionUrlOrigin(imageFunctionUrl);
    const s3Origin = origins.S3BucketOrigin.withOriginAccessControl(assetsBucket);

    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: serverOrigin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
      },
      additionalBehaviors: {
        '_next/static/*': {
          origin: s3Origin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        '_next/image': {
          origin: imageOrigin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        },
      },
    });

    // Deploy static assets to S3
    new s3deploy.BucketDeployment(this, 'DeployAssets', {
      sources: [s3deploy.Source.asset(path.join(openNextOutputPath, 'assets'))],
      destinationBucket: assetsBucket,
      distribution: this.distribution,
      distributionPaths: ['/_next/static/*'],
    });
  }
}
