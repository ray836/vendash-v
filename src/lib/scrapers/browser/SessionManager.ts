import { Protocol } from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface SessionData {
  cookies: Protocol.Network.Cookie[];
  createdAt: string;
  expiresAt: string;
  domain: string;
}

/**
 * Manages browser session persistence via cookie storage
 * Helps bypass bot detection by reusing authenticated sessions
 */
export class SessionManager {
  private sessionsDir: string;

  constructor(sessionsDir: string = '.scraper-sessions') {
    this.sessionsDir = path.join(process.cwd(), sessionsDir);
  }

  /**
   * Initialize session directory
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.sessionsDir, { recursive: true });
    } catch (error) {
      console.error('[SessionManager] Failed to create sessions directory:', error);
    }
  }

  /**
   * Save session cookies to disk
   */
  async saveSession(domain: string, cookies: Protocol.Network.Cookie[]): Promise<void> {
    await this.initialize();

    const sessionData: SessionData = {
      cookies,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      domain,
    };

    const filename = this.getSessionFilename(domain);
    const filepath = path.join(this.sessionsDir, filename);

    try {
      await fs.writeFile(filepath, JSON.stringify(sessionData, null, 2));
      console.log(`[SessionManager] ✓ Session saved for ${domain}`);
      console.log(`[SessionManager] Expires: ${sessionData.expiresAt}`);
    } catch (error) {
      console.error(`[SessionManager] Failed to save session for ${domain}:`, error);
      throw error;
    }
  }

  /**
   * Load session cookies from disk
   */
  async loadSession(domain: string): Promise<Protocol.Network.Cookie[] | null> {
    const filename = this.getSessionFilename(domain);
    const filepath = path.join(this.sessionsDir, filename);

    try {
      const fileContent = await fs.readFile(filepath, 'utf-8');
      const sessionData: SessionData = JSON.parse(fileContent);

      // Check if session is expired
      if (new Date(sessionData.expiresAt) < new Date()) {
        console.log(`[SessionManager] Session expired for ${domain}`);
        await this.deleteSession(domain);
        return null;
      }

      // Check if session is nearing expiry (within 1 day)
      const expiryDate = new Date(sessionData.expiresAt);
      const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      if (expiryDate < oneDayFromNow) {
        console.warn(`[SessionManager] ⚠️  Session for ${domain} expires soon: ${sessionData.expiresAt}`);
      }

      console.log(`[SessionManager] ✓ Session loaded for ${domain} (${sessionData.cookies.length} cookies)`);
      return sessionData.cookies;
    } catch (error) {
      // Session file doesn't exist or is invalid
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log(`[SessionManager] No saved session found for ${domain}`);
      } else {
        console.error(`[SessionManager] Failed to load session for ${domain}:`, error);
      }
      return null;
    }
  }

  /**
   * Check if a valid session exists
   */
  async hasValidSession(domain: string): Promise<boolean> {
    const cookies = await this.loadSession(domain);
    return cookies !== null && cookies.length > 0;
  }

  /**
   * Delete a session
   */
  async deleteSession(domain: string): Promise<void> {
    const filename = this.getSessionFilename(domain);
    const filepath = path.join(this.sessionsDir, filename);

    try {
      await fs.unlink(filepath);
      console.log(`[SessionManager] Session deleted for ${domain}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error(`[SessionManager] Failed to delete session for ${domain}:`, error);
      }
    }
  }

  /**
   * Get session info (for UI display)
   */
  async getSessionInfo(domain: string): Promise<SessionData | null> {
    const filename = this.getSessionFilename(domain);
    const filepath = path.join(this.sessionsDir, filename);

    try {
      const fileContent = await fs.readFile(filepath, 'utf-8');
      const sessionData: SessionData = JSON.parse(fileContent);
      return sessionData;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate filename for session storage
   */
  private getSessionFilename(domain: string): string {
    // Sanitize domain for filename
    const sanitized = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    return `${sanitized}-session.json`;
  }
}
