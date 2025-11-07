import { PreDeploymentStatus } from '../enums/pre-deployment-status.enum';

export interface TiApiUpdateDeployment {
  status?: PreDeploymentStatus,
  error?: string,
  metadata?: Record<string, any>,
  updateJobUrl?: boolean,
}
