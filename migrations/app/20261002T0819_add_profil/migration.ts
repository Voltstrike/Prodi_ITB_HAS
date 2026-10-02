#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/2bee2ea034e2658c28b284f94cb78cb653b8a087ffed4da0e98567f539e61def/contract';
import startContract from '../../snapshots/2bee2ea034e2658c28b284f94cb78cb653b8a087ffed4da0e98567f539e61def/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/d37055a58a11543fcf6d146b72f223d639c593475a78a6aa1f5e648c87439ab6/contract';
import endContract from '../../snapshots/d37055a58a11543fcf6d146b72f223d639c593475a78a6aa1f5e648c87439ab6/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'profil',
        columns: [
          col('akreditasi', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('dokumenAkreditasi', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('misi', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sejarah', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('struktur', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('visi', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);