"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnexpectedResponseError = exports.NotFoundError = exports.ServerOfflineError = exports.UrlNotSupportedError = exports.TokenExpiredError = exports.NotAutenticatedError = void 0;
exports.parseJson = parseJson;
exports.errorMessage = errorMessage;
/* eslint-disable max-classes-per-file */
class NotAutenticatedError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotAutenticatedError';
    }
}
exports.NotAutenticatedError = NotAutenticatedError;
class TokenExpiredError extends NotAutenticatedError {
    constructor(message) {
        super(message);
        this.name = 'TokenExpiredError';
    }
}
exports.TokenExpiredError = TokenExpiredError;
class UrlNotSupportedError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UrlNotSupportedError';
    }
}
exports.UrlNotSupportedError = UrlNotSupportedError;
class ServerOfflineError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ServerOfflineError';
    }
}
exports.ServerOfflineError = ServerOfflineError;
class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class UnexpectedResponseError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UnexpectedResponseError';
    }
}
exports.UnexpectedResponseError = UnexpectedResponseError;
function parseJson(json) {
    try {
        return JSON.parse(json);
    }
    catch (e) {
        throw new UnexpectedResponseError(e.message);
    }
}
function errorMessage(error, authenticationUrl) {
    if (error instanceof NotAutenticatedError) {
        return api.storage.lang('Error_Authenticate', [authenticationUrl]);
    }
    if (error instanceof ServerOfflineError) {
        return 'Server Offline';
    }
    if (error instanceof UrlNotSupportedError) {
        return `Incorrect url provided [${error.message}]`;
    }
    if (error instanceof NotFoundError) {
        return 'Could not find this entry';
    }
    return error.message;
}
//# sourceMappingURL=Errors.js.map