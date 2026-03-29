export interface JwtAccessPayload {
  id: string;
  email: string;
  role: string;
  totpEnabled: boolean;
  mfaVerified: boolean;
}
