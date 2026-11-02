#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/1322c7e4b60615b121c8aeb0d6b749cfa032ffe766a2b4e242424f0b111eca87/contract';
import startContract from '../../snapshots/1322c7e4b60615b121c8aeb0d6b749cfa032ffe766a2b4e242424f0b111eca87/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/275a1fff110ed606f2e9a154a9442e63b0695c3d42213e5571ff65c6fc937366/contract';
import endContract from '../../snapshots/275a1fff110ed606f2e9a154a9442e63b0695c3d42213e5571ff65c6fc937366/contract.json' with { type: 'json' };
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
        table: 'beranda',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('fotoKalenderAkademik', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('fotoKegiatanKampus', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('fotoKurikulum', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('fotoPendaftaran', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('fotoProdi', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('singletonKey', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('beranda_singleton_key_dbdbc99e', '"singletonKey" = 1'),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'beranda',
        constraint: 'beranda_singletonKey_key',
        columns: ['singletonKey'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
