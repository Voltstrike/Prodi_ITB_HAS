#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/0198f424bbcc7c8aa2703584bf4046eebdd6fb850e02e5327ffc4c6575ec7dc8/contract';
import startContract from '../../snapshots/0198f424bbcc7c8aa2703584bf4046eebdd6fb850e02e5327ffc4c6575ec7dc8/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/32ec3705587e447676509fc58ec87980ebe0d9c983282ee94aa4f0e26116e342/contract';
import endContract from '../../snapshots/32ec3705587e447676509fc58ec87980ebe0d9c983282ee94aa4f0e26116e342/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'publikasiIlmiah',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('ditampilkan', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('doi', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('jenis', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('judul', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('penulis', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('ringkasan', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sumber', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('tahun', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('tautanPublikasi', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('publikasi_ilmiah_jenis_ac9352d8', "\"jenis\" IN ('TESIS', 'ARTIKEL')"),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'publikasiIlmiah',
        constraint: 'publikasiIlmiah_slug_key',
        columns: ['slug'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'publikasiIlmiah',
        constraint: 'publikasiIlmiah_doi_key',
        columns: ['doi'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'publikasiIlmiah',
        index: 'publikasiIlmiah_ditampilkan_tahun_id_idx_28cdcc90',
        columns: ['ditampilkan', 'tahun', 'id'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
