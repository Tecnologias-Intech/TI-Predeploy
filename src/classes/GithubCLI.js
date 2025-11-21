"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubCLIOperator = void 0;
const exec = __importStar(require("@actions/exec"));
const github = __importStar(require("@actions/github"));
const Notifications_1 = require("./Notifications");
const pre_deployment_status_enum_1 = require("../enums/pre-deployment-status.enum");
class GithubCLIOperator {
    constructor({ origin, target, botToken, pat, tiApi }) {
        this.origin = '';
        this.target = '';
        this.owner = '';
        this.repo = '';
        this.patOctokit = null;
        this.botOctokit = null;
        this.pat = '';
        this.notification = new Notifications_1.Notifications('[TI-Deploy/Github-Cli]');
        this.tiApi = null;
        this.origin = origin;
        this.target = target;
        this.owner = github.context.repo.owner;
        this.repo = github.context.repo.repo;
        this.patOctokit = github.getOctokit(pat);
        this.botOctokit = github.getOctokit(botToken);
        this.tiApi = tiApi;
        this.pat = pat;
    }
    updateBranch() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const { data: user } = yield this.patOctokit.rest.users.getAuthenticated();
            const userName = user.login;
            const userEmail = user.email || `${user.login}@users.noreply.github.com`;
            this.notification.info(`Using PAT user: ${user.name || userName}`);
            yield ((_a = this.tiApi) === null || _a === void 0 ? void 0 : _a.updateDeployment({ status: pre_deployment_status_enum_1.PreDeploymentStatus.SETTING_CREDENTIALS }));
            this.notification.info('Setting PAT credentials for git');
            yield exec.exec('git', ['config', 'user.name', userName]);
            yield exec.exec('git', ['config', 'user.email', userEmail]);
            yield exec.exec('git', [
                'remote', 'set-url', 'origin',
                `https://${userName}:${this.pat}@github.com/${this.owner}/${this.repo}.git`
            ]);
            this.notification.success('PAT credentials applied');
            try {
                yield exec.exec('git', ['fetch', 'origin']);
                yield ((_b = this.tiApi) === null || _b === void 0 ? void 0 : _b.updateDeployment({ status: pre_deployment_status_enum_1.PreDeploymentStatus.UPDATING_TARGET }));
                this.notification.info(`Updating ${this.target} with latest changes from ${this.origin}`);
                yield exec.exec('git', ['checkout', this.target]);
                yield exec.exec('git', ['pull', 'origin', this.target]);
                yield exec.exec('git', ['fetch', 'origin', this.origin]);
                yield exec.exec('git', ['merge', '--no-ff', `origin/${this.origin}`]);
                yield exec.exec('git', ['push', 'origin', this.target]);
                this.notification.success(`${this.target} branch updated with latest ${this.origin} changes`);
                yield ((_c = this.tiApi) === null || _c === void 0 ? void 0 : _c.updateDeployment({ status: pre_deployment_status_enum_1.PreDeploymentStatus.UPDATING_SOURCE }));
                this.notification.info(`Synchronizing ${this.origin} with updated ${this.target}`);
                yield exec.exec('git', ['checkout', this.origin]);
                yield exec.exec('git', ['pull', 'origin', this.origin]);
                yield exec.exec('git', ['fetch', 'origin', this.target]);
                try {
                    yield exec.exec('git', ['merge', '--ff-only', `origin/${this.target}`]);
                    yield exec.exec('git', ['push', 'origin', this.origin]);
                    this.notification.success(`${this.origin} fast-forwarded to ${this.target} — no differences left`);
                }
                catch (ffErr) {
                    this.notification.warning('Fast-forward not possible, doing merge instead');
                    yield exec.exec('git', ['merge', `origin/${this.target}`]);
                    yield exec.exec('git', ['push', 'origin', this.origin]);
                    this.notification.success(`${this.origin} merged with ${this.target} (commit created, but synced)`);
                }
            }
            catch (e) {
                this.notification.error('Branch synchronization failed', e);
                throw e;
            }
        });
    }
}
exports.GithubCLIOperator = GithubCLIOperator;
