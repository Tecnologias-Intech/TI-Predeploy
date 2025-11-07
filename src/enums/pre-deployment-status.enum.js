"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreDeploymentStatus = void 0;
var PreDeploymentStatus;
(function (PreDeploymentStatus) {
    PreDeploymentStatus["PENDING"] = "pending";
    PreDeploymentStatus["SETTING_CREDENTIALS"] = "setting_credentials";
    PreDeploymentStatus["UPDATING_TARGET"] = "updating_target";
    PreDeploymentStatus["UPDATING_SOURCE"] = "updating_source";
    PreDeploymentStatus["UPDATED"] = "updated";
})(PreDeploymentStatus || (exports.PreDeploymentStatus = PreDeploymentStatus = {}));
