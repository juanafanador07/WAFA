import { AuthenticationState } from "baileys";

export interface BaileysAuthStore {
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
  clear: () => Promise<void>;
}
