#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/1322c7e4b60615b121c8aeb0d6b749cfa032ffe766a2b4e242424f0b111eca87/contract';
import endContract from '../../snapshots/1322c7e4b60615b121c8aeb0d6b749cfa032ffe766a2b4e242424f0b111eca87/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/cb6e6bd3cf79cac95db144530d89d85c098d9763461887e9a856c9e65c7ee9f3/contract';
import startContract from '../../snapshots/cb6e6bd3cf79cac95db144530d89d85c098d9763461887e9a856c9e65c7ee9f3/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'dokumenKurikulum',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('filename', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('judul', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('namaAsli', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('ukuran', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'dokumenKurikulum',
        constraint: 'dokumenKurikulum_filename_key',
        columns: ['filename'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
