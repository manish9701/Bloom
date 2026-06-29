declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_URL?: string;
    WEBSITE_URL?: string;
    EXPO_PUBLIC_GOOGLE_AI_KEY?: string;
    AWS_REGION?: string;
    AWS_ACCESS_KEY_ID?: string;
    AWS_SECRET_ACCESS_KEY?: string;
    DYNAMO_TABLE_NAME?: string;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};

