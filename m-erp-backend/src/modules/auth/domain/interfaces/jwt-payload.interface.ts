export interface JwtPayload {
  sub: string; // usuario id
  username: string; // credencial username
  role: string; // rol nombre
  userId: string;
  personaId: string | null;
}
