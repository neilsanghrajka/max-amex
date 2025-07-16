export class LLMError extends Error {
  constructor(
    message: string,
    public provider: string,
    public code?: string,
    public cause?: Error,
  ) {
    super(message);
    this.name = "LLMError";
  }
}
