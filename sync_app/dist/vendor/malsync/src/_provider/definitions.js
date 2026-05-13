"use strict";
/* eslint-disable no-shadow */
/* export enum type {
  Anime = "anime",
  Manga = "manga"
} */
Object.defineProperty(exports, "__esModule", { value: true });
exports.score = exports.status = void 0;
var status;
(function (status) {
    status[status["NoState"] = 0] = "NoState";
    status[status["Watching"] = 1] = "Watching";
    status[status["Completed"] = 2] = "Completed";
    status[status["Onhold"] = 3] = "Onhold";
    status[status["Dropped"] = 4] = "Dropped";
    status[status["PlanToWatch"] = 6] = "PlanToWatch";
    status[status["All"] = 7] = "All";
    status[status["Rewatching"] = 23] = "Rewatching";
    status[status["Considering"] = 24] = "Considering";
})(status || (exports.status = status = {}));
var score;
(function (score) {
    score[score["NoScore"] = 0] = "NoScore";
    score[score["R1"] = 1] = "R1";
    score[score["R2"] = 2] = "R2";
    score[score["R3"] = 3] = "R3";
    score[score["R4"] = 4] = "R4";
    score[score["R5"] = 5] = "R5";
    score[score["R6"] = 6] = "R6";
    score[score["R7"] = 7] = "R7";
    score[score["R8"] = 8] = "R8";
    score[score["R9"] = 9] = "R9";
    score[score["R10"] = 10] = "R10";
})(score || (exports.score = score = {}));
//# sourceMappingURL=definitions.js.map