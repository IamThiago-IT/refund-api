import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Fix values that were saved without prepare (e.g., 150.50 saved as 150.5)
    // Converts reais -> cents. Only touches rows where value looks like reais
    // (has fractional part or < 100000 and not already cents-aligned).
    // Safe to run multiple times: rows already in cents (>= 100 and integer)
    // that are plausible cent values will be left as-is if they were
    // originally integers like 150 (would become 15000, but original valid
    // reais 150 would have been 15000 already). We only fix rows where
    // value has a fractional part, indicating the old bug.
    await this.db.rawQuery(`
      UPDATE refunds
      SET value = CAST(ROUND(value * 100) AS INTEGER)
      WHERE value != CAST(value AS INTEGER)
    `)
  }

  async down() {
    await this.db.rawQuery(`
      UPDATE refunds
      SET value = CAST(value / 100 AS INTEGER)
      WHERE value = CAST(value AS INTEGER)
    `)
  }
}
