export class AppError extends Error {
  public constructor(
    public readonly status: number,
    message: string,
    public readonly detalhes?: Record<string, string>,
  ) {
    super(message);
    this.name = "AppError";
  }
}
