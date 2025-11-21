import axios from 'axios';
import { TiApiUpdateDeployment } from '../interfaces/ti-api.interface';
import { Notifications } from './Notifications';
import { getJobId } from '../functions/getCurrentJobId';

export class TiApi {
  private notification = new Notifications('[TI-Deploy/Ti-Api]',
    {
      info: '🟦',
      success: '🟩',
      warning: '🟨',
      error: '🟥'
    }
  );
  projectId: string = '';
  tiApiUrl = '';
  repoId = '';

  constructor({ projectId, tiApiUrl, repoId }: {
    projectId: string,
    tiApiUrl: string,
    repoId: string
  }) {
    this.projectId = projectId;
    this.tiApiUrl = tiApiUrl;
    this.repoId = repoId;
  }

  public async updateDeployment(data: TiApiUpdateDeployment): Promise<void> {
    const url = this.tiApiUrl + `/${this.projectId}/${this.repoId}`;

    let body: Record<string, any> = {
      projectId: this.projectId
    };

    if (data.status) body.status = data.status;
    if (data.error) body.error = data.error;
    if (data.metadata) body = { ...body, ...data.metadata };

    if (data.updateJobUrl) {
      const { GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID } = process.env;
      if (GITHUB_SERVER_URL && GITHUB_REPOSITORY && GITHUB_RUN_ID) {
        const actionUrl = `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`;
        const jobId = await getJobId();

        body.action = {
          url: actionUrl,
          id: +GITHUB_RUN_ID,
          job: jobId,
          url2: `${actionUrl}/job/${jobId}`
        };
      } else {
        this.notification.warning('The environment variables needed to build the job URL could not be obtained');
      }
    }

    this.notification.info(`\nCalling endpoint ${url} \nWith payload: ${JSON.stringify(body)}`);

    try {
      const res = await axios.post(url, body, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      this.notification.success(`Response: ${JSON.stringify(res.data)}`);
    } catch (error: any) {
      if (error.response?.data?.message) {
        this.notification.error(`Error calling Intech API: ${error.response.data.message}`);
      } else {
        this.notification.error(`Error calling Intech API: ${error.message}`);
      }

      console.error('Error details:', error.response?.data);
    }
  }
}
