// SECRET_KEY must be provided via the NEXT_PUBLIC_SECRET_KEY environment variable.
const rawKey = process.env.NEXT_PUBLIC_SECRET_KEY;
if (!rawKey) {
  console.error("[Conduit] NEXT_PUBLIC_SECRET_KEY environment variable is not set!");
}
export const SECRET_KEY: string = rawKey ?? "";
export const API_ENCRYPTION_ENABLED: boolean = true;
