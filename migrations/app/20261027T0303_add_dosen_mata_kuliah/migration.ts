#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/9c136552c5e895399a23730ec3b8c8456c832f9c391ca2664db32d6d09f3f9ed/contract';
import endContract from '../../snapshots/9c136552c5e895399a23730ec3b8c8456c832f9c391ca2664db32d6d09f3f9ed/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/f5aba80ff5882e874493f6b927474fb663f280b1554a35b0832928058bfc9252/contract';
import startContract from '../../snapshots/f5aba80ff5882e874493f6b927474fb663f280b1554a35b0832928058bfc9252/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'dosenMataKuliah',
        columns: [
          col('dosenId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('kurikulumId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'dosenMataKuliah',
        constraint: 'dosenMataKuliah_dosenId_kurikulumId_key',
        columns: ['dosenId', 'kurikulumId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'dosenMataKuliah',
        index: 'dosenMataKuliah_dosenId_idx_395e7029',
        columns: ['dosenId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'dosenMataKuliah',
        index: 'dosenMataKuliah_kurikulumId_idx_2ad0dca9',
        columns: ['kurikulumId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'dosenMataKuliah',
        foreignKey: {
          name: 'dosenMataKuliah_dosenId_fkey',
          columns: ['dosenId'],
          references: { schema: 'public', table: 'dosen', columns: ['id'] },
          onDelete: 'cascade',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'dosenMataKuliah',
        foreignKey: {
          name: 'dosenMataKuliah_kurikulumId_fkey',
          columns: ['kurikulumId'],
          references: { schema: 'public', table: 'kurikulum', columns: ['id'] },
          onDelete: 'cascade',
          onUpdate: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
