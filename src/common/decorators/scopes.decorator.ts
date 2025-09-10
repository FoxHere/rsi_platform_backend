import { SetMetadata } from "@nestjs/common";

export const SCOPES_KEY = 'scopes';
export const Scopes = (...scopes: String[]) => SetMetadata(SCOPES_KEY, scopes);