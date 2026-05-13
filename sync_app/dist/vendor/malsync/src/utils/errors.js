"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomDomainError = exports.MissingDataError = exports.SafeError = exports.MissingPlayerError = void 0;
/* eslint-disable max-classes-per-file */
class MissingPlayerError extends Error {
    constructor(url) {
        const parts = url.split('/');
        let domain = url;
        if (parts.length > 2)
            domain = parts[2];
        super(domain);
        this.url = url;
        this.name = 'MissingPlayerError';
    }
}
exports.MissingPlayerError = MissingPlayerError;
class SafeError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SafeError';
    }
}
exports.SafeError = SafeError;
class MissingDataError extends Error {
    constructor(message) {
        super(message);
        this.name = 'MissingDataError';
    }
}
exports.MissingDataError = MissingDataError;
class CustomDomainError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CustomDomainError';
    }
}
exports.CustomDomainError = CustomDomainError;
//# sourceMappingURL=errors.js.map