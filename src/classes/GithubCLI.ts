import * as exec from '@actions/exec';
import * as github from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';
import { Notifications } from './Notifications';
import { TiApi } from './TiApi';
import { PreDeploymentStatus } from '../enums/pre-deployment-status.enum';
import * as core from '@actions/core';

export class GithubCLIOperator {
  origin = '';
  target = '';
  owner = '';
  repo = '';

  patOctokit: InstanceType<typeof GitHub> | null = null;
  botOctokit: InstanceType<typeof GitHub> | null = null;
  pat = '';

  private notification = new Notifications('[TI-Deploy/Github-Cli]');
  tiApi: TiApi | null = null;

  constructor({
    origin,
    target,
    botToken,
    pat,
    tiApi
  }: {
    origin: string,
    target: string,
    botToken: string,
    pat: string,
    tiApi: TiApi
  }) {
    this.origin = origin;
    this.target = target;


    this.owner = github.context.repo.owner;
    this.repo = github.context.repo.repo;

    this.patOctokit = github.getOctokit(pat);
    this.botOctokit = github.getOctokit(botToken);
    this.tiApi = tiApi;
    this.pat = pat;
  }

  public async updateBranch(): Promise<void> {
    const { data: user } = await this.patOctokit!.rest.users.getAuthenticated();

    const userName = user.login;
    const userEmail = user.email || `${user.login}@users.noreply.github.com`;
    this.notification.info(`Using PAT user: ${user.name || userName}`);

    await this.tiApi?.updateDeployment({ status: PreDeploymentStatus.SETTING_CREDENTIALS });
    this.notification.info('Setting PAT credentials for git');

    await exec.exec('git', ['config', 'user.name', userName]);
    await exec.exec('git', ['config', 'user.email', userEmail]);

    await exec.exec('git', [
      'remote', 'set-url', 'origin',
      `https://${userName}:${this.pat}@github.com/${this.owner}/${this.repo}.git`
    ]);
    this.notification.success('PAT credentials applied');

    try {
      await exec.exec('git', ['fetch', 'origin']);

      await this.tiApi?.updateDeployment({ status: PreDeploymentStatus.UPDATING_TARGET });
      this.notification.info(`Updating ${this.target} with latest changes from ${this.origin}`);

      await exec.exec('git', ['checkout', this.target]);
      await exec.exec('git', ['pull', 'origin', this.target]);
      await exec.exec('git', ['fetch', 'origin', this.origin]);
      await exec.exec('git', ['merge', '--no-ff', `origin/${this.origin}`]);
      await exec.exec('git', ['push', 'origin', this.target]);
      this.notification.success(`${this.target} branch updated with latest ${this.origin} changes`);

      await this.tiApi?.updateDeployment({ status: PreDeploymentStatus.UPDATING_SOURCE });
      this.notification.info(`Synchronizing ${this.origin} with updated ${this.target}`);
      await exec.exec('git', ['checkout', this.origin]);
      await exec.exec('git', ['pull', 'origin', this.origin]);
      await exec.exec('git', ['fetch', 'origin', this.target]);

      try {
        await exec.exec('git', ['merge', '--ff-only', `origin/${this.target}`]);
        await exec.exec('git', ['push', 'origin', this.origin]);
        this.notification.success(`${this.origin} fast-forwarded to ${this.target} — no differences left`);
      } catch (ffErr) {
        this.notification.warning('Fast-forward not possible, doing merge instead');
        await exec.exec('git', ['merge', `origin/${this.target}`]);
        await exec.exec('git', ['push', 'origin', this.origin]);
        this.notification.success(`${this.origin} merged with ${this.target} (commit created, but synced)`);
      }
    } catch (e) {
      this.notification.error('Branch synchronization failed', e);
      throw e;
    }
  }
}

