import pool from '../config/database';

export interface Setting {
  id: number;
  key: string;
  value: string | null;
  type: string;
}

export class SettingRepository {
  async findAll(): Promise<Setting[]> {
    const [rows] = await pool.query('SELECT * FROM settings ORDER BY id ASC');
    return rows as Setting[];
  }

  async findByKey(key: string): Promise<Setting | null> {
    const [rows] = await pool.query('SELECT * FROM settings WHERE `key` = ?', [key]);
    const settings = rows as Setting[];
    return settings[0] || null;
  }

  async update(key: string, value: string): Promise<void> {
    await pool.query('UPDATE settings SET `value` = ? WHERE `key` = ?', [value, key]);
  }

  async updateMultiple(settings: { key: string; value: string }[]): Promise<void> {
    for (const setting of settings) {
      await this.update(setting.key, setting.value);
    }
  }
}

export default new SettingRepository();
