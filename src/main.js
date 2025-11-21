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
const core = __importStar(require("@actions/core"));
const TiApi_1 = require("./classes/TiApi");
const GithubCLI_1 = require("./classes/GithubCLI");
const pre_deployment_status_enum_1 = require("./enums/pre-deployment-status.enum");
const run = () => __awaiter(void 0, void 0, void 0, function* () {
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
    const tiApi = new TiApi_1.TiApi({ projectId, tiApiUrl, repoId });
    try {
        yield (tiApi === null || tiApi === void 0 ? void 0 : tiApi.updateDeployment({ updateJobUrl: true }));
        const githubCli = new GithubCLI_1.GithubCLIOperator({
            origin,
            target,
            botToken,
            pat,
            tiApi
        });
        yield githubCli.updateBranch();
        yield tiApi.updateDeployment({ status: pre_deployment_status_enum_1.PreDeploymentStatus.UPDATED });
        console.log(`\n\n
    ************************************
    *******   UPDATE FINISHED    *******
    ************************************
    \n\n`);
    }
    catch (error) {
        let message = '';
        if (error instanceof Error)
            message = error.message;
        else
            message = 'An unexpected error occur during execution.';
        yield tiApi.updateDeployment({ error: message });
        core.setFailed(message);
    }
});
run();
