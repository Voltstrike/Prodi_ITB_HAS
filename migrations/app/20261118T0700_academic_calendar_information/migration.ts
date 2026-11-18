#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/101e954a136905b7d44a5c5d62bea6a026be0edacf6b99465769e10c7b74724b/contract';
import endContract from '../../snapshots/101e954a136905b7d44a5c5d62bea6a026be0edacf6b99465769e10c7b74724b/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/5884e1e45d7e37c9b182bd94b0744b579bb4068b4d349b85fba111a542da4c99/contract';
import startContract from '../../snapshots/5884e1e45d7e37c9b182bd94b0744b579bb4068b4d349b85fba111a542da4c99/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'informasiAkademik',
        column: col('diterbitkanPada', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'informasiAkademik',
        column: col('status', 'text', {
          notNull: true,
          default: lit('PUBLISHED'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'informasiAkademik',
        column: col('utama', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'kalenderAkademik',
        column: col('keterangan', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'kalenderAkademik',
        column: col('semester', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'kalenderAkademik',
        column: col('status', 'text', {
          notNull: true,
          default: lit('PUBLISHED'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'kalenderAkademik',
        column: col('tahunAkademik', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'informasiAkademik',
        constraint: 'informasi_akademik_status_1b4a7b6b',
        expression: "\"status\" IN ('DRAFT', 'PUBLISHED')",
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'kalenderAkademik',
        constraint: 'kalender_akademik_semester_758a09af',
        expression: '"semester" IS NULL OR "semester" IN (\'GANJIL\', \'GENAP\')',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'kalenderAkademik',
        constraint: 'kalender_akademik_status_1b4a7b6b',
        expression: "\"status\" IN ('DRAFT', 'PUBLISHED')",
      }),
      this.createIndex({
        schema: 'public',
        table: 'informasiAkademik',
        index: 'informasiAkademik_status_diterbitkanPada_id_idx_12465584',
        columns: ['status', 'diterbitkanPada', 'id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'informasiAkademik',
        index: 'informasi_akademik_satu_utama_751771f5',
        columns: ['utama'],
        extras: { where: '"utama" = true AND "status" = \'PUBLISHED\'', unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'kalenderAkademik',
        index: 'kalenderAkademik_status_tanggalMulai_id_idx_aef62342',
        columns: ['status', 'tanggalMulai', 'id'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
