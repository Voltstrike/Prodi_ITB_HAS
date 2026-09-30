#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/2bee2ea034e2658c28b284f94cb78cb653b8a087ffed4da0e98567f539e61def/contract';
import endContract from '../../snapshots/2bee2ea034e2658c28b284f94cb78cb653b8a087ffed4da0e98567f539e61def/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/41b3a595eb18c3bd2586f0c3317d32d861ce6fecb14139014454a2e5aa87a187/contract';
import startContract from '../../snapshots/41b3a595eb18c3bd2586f0c3317d32d861ce6fecb14139014454a2e5aa87a187/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'staff',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('foto', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('jabatan', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('lingkupKerja', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('nama', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('pendidikan', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
