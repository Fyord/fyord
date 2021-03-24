export enum Environments {
  Development = 'development',
  Production = 'production'
}

export enum EnvironmentVariables {
  Mode = 'mode',
  ApiServer = 'apiServer'
}

export const DevelopmentEnvironmentVariables = new Map<string, string>([
  [EnvironmentVariables.Mode, Environments.Development],
  [EnvironmentVariables.ApiServer, 'http://localhost:5000']
]);

export const ProductionEnvironmentVariables = new Map<string, string>([
  [EnvironmentVariables.Mode, Environments.Production],
  [EnvironmentVariables.ApiServer, 'http://www.example.com/api']
]);
