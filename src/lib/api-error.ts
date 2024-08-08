interface ApiErrorConstructor {
  message: string;
  status?: number;
  detailedMessage?: string;
}

export class ApiError extends Error {
  detailedMessage?: string;
  status: number;

  constructor({ message, status, detailedMessage }: ApiErrorConstructor) {
    super(message);
    this.name = "ApiError";
    this.status = status ?? 500;
    this.detailedMessage = detailedMessage;
  }
}
