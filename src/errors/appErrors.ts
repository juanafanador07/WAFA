export class AppError extends Error {
  type: string;
  title: string;
  detail: string;

  constructor(type: string, title: string, detail: string) {
    super(detail);
    this.type = type;
    this.title = title;
    this.detail = detail;
  }
}

export class ValidationError extends AppError {
  errors;

  constructor(
    detail: string,
    errors: { detail: string; pointer: string }[] = [],
  ) {
    super("validation-error", "Your request is not valid.", detail);
    this.errors = errors;
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(detail: string) {
    super("payload-too-large", "Payload too large", detail);
  }
}

export class WaClientLoggedOutError extends AppError {
  constructor(detail: string) {
    super("client-logged-out", "WhatsApp client is logged out.", detail);
  }
}

export class WaClientNotReadyError extends AppError {
  constructor(detail: string) {
    super("client-not-ready", "WhatsApp client is not ready.", detail);
  }
}

export class WaClientUnexpectedError extends AppError {
  constructor(detail: string) {
    super("client-error", "WhatsApp client encountered an error.", detail);
  }
}
