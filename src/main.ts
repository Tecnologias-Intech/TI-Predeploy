import * as core from '@actions/core';
import { TiApi } from './classes/TiApi';
import { GithubCLIOperator } from './classes/GithubCLI';
import { PreDeploymentStatus } from './enums/pre-deployment-status.enum';

const run = async (): Promise<void> => {
  console.log(`\n\n
    ***********************************
    *******   UPDATE STARTED    *******
    ***********************************
    \n\n`);

  const botToken = core.getInput('github-token', { required: true });
  const origin = core.getInput('origin-branch', { required: true });
  const target = core.getInput('target-branch', { required: true });
  const projectId = core.getInput('project-id', { required: true });
  const repoId = core.getInput('repo-id');
  const pat = core.getInput('pat', { required: true });
  const tiApiUrl = core.getInput('ti-api', { required: true });
  const tiApi = new TiApi({ projectId, tiApiUrl, repoId });

  try {
    await tiApi?.updateDeployment({ updateJobUrl: true });

    const githubCli = new GithubCLIOperator({
      origin,
      target,
      botToken,
      pat,
      tiApi
    });

    await githubCli.updateBranch();
    await tiApi.updateDeployment({ status: PreDeploymentStatus.UPDATED });

    console.log(`\n\n
    ************************************
    *******   UPDATE FINISHED    *******
    ************************************
    \n\n`);

  } catch (error) {
    let message = '';

    if (error instanceof Error) message = error.message;
    else message = 'An unexpected error occur during execution.';

    await tiApi.updateDeployment({ error: message });
    core.setFailed(message);
  }
};

run();
