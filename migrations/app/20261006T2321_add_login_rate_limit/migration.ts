#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/8ec48a632d3db18aeee5d2d92e2e1bbc24d27874100760dd3071a23c44e48e45/contract';
import endContract from '../../snapshots/8ec48a632d3db18aeee5d2d92e2e1bbc24d27874100760dd3071a23c44e48e45/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/d37055a58a11543fcf6d146b72f223d639c593475a78a6aa1f5e648c87439ab6/contract';
import startContract from '../../snapshots/d37055a58a11543fcf6d146b72f223d639c593475a78a6aa1f5e648c87439ab6/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'loginRateLimit',
        columns: [
          col('count', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('firstAttemptAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('key', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'loginRateLimit',
        constraint: 'loginRateLimit_key_key',
        columns: ['key'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
