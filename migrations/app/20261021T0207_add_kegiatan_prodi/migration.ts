#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/6f96652b8d54ba5b5f57167fb784ed0d1b3f5ea69945373c0a6587fee45c200f/contract';
import startContract from '../../snapshots/6f96652b8d54ba5b5f57167fb784ed0d1b3f5ea69945373c0a6587fee45c200f/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/f5aba80ff5882e874493f6b927474fb663f280b1554a35b0832928058bfc9252/contract';
import endContract from '../../snapshots/f5aba80ff5882e874493f6b927474fb663f280b1554a35b0832928058bfc9252/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'kegiatanProdi',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('dosenId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('foto', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('jenis', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('judul', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('ringkasan', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('tahun', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('tautanHasil', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('uraian', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'kegiatan_prodi_jenis_bed1f6bd',
            "\"jenis\" IN ('PENELITIAN', 'PENGABDIAN')",
          ),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'kegiatanProdi',
        constraint: 'kegiatanProdi_slug_key',
        columns: ['slug'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'kegiatanProdi',
        index: 'kegiatanProdi_dosenId_idx_395e7029',
        columns: ['dosenId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'kegiatanProdi',
        foreignKey: {
          name: 'kegiatanProdi_dosenId_fkey',
          columns: ['dosenId'],
          references: { schema: 'public', table: 'dosen', columns: ['id'] },
          onDelete: 'restrict',
          onUpdate: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
