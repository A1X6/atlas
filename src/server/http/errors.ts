/**
 * Domain error types shared by the service layer. These are framework-agnostic
 * (no Next imports) so the same services can run under any transport — web API,
 * a future Express/Nest server, or a mobile BFF. The HTTP layer maps them to
 * status codes in `respond.ts`.
 */

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "EMAIL_NOT_VERIFIED"
  | "PHONE_NOT_VERIFIED"
  | "ACCOUNT_LOCKED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "EXTERNAL_SERVICE_ERROR"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(statusCode: number, code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid request", details?: unknown) {
    super(400, "VALIDATION_ERROR", message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(401, "UNAUTHORIZED", message);
  }
}

/**
 * Raised when a login's credentials are correct but the email used hasn't been
 * verified yet. Distinct from UNAUTHORIZED so the client can prompt the user to
 * verify / resend rather than re-enter their password. Only thrown after a
 * successful password check, so it doesn't enable account enumeration.
 */
export class EmailNotVerifiedError extends AppError {
  constructor(message = "Please verify your email address before signing in") {
    super(403, "EMAIL_NOT_VERIFIED", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(403, "FORBIDDEN", message);
  }
}

/** Raised when an action requires a phone number that hasn't been SMS-verified
 *  (e.g. making an unverified number your primary). */
export class PhoneNotVerifiedError extends AppError {
  constructor(message = "Verify this phone number by SMS before making it your primary") {
    super(400, "PHONE_NOT_VERIFIED", message);
  }
}

/** Raised when an account is temporarily locked after too many failed logins. */
export class AccountLockedError extends AppError {
  constructor(message = "Too many failed attempts. This account is temporarily locked.") {
    super(403, "ACCOUNT_LOCKED", message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(404, "NOT_FOUND", message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(409, "CONFLICT", message);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests. Please try again later.") {
    super(429, "RATE_LIMITED", message);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message = "An upstream service is unavailable") {
    super(503, "EXTERNAL_SERVICE_ERROR", message);
  }
}
