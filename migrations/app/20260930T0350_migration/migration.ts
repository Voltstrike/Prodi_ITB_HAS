#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/30d14f64b264e992bc36caba3271cd19dfba45b6d684fe4602ef8e27a58ddec6/contract';
import startContract from '../../snapshots/30d14f64b264e992bc36caba3271cd19dfba45b6d684fe4602ef8e27a58ddec6/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/e6a72e8efec4431ef4f64f9b521cff9b4fc8a607795a4c8d02055630485aad8e/contract';
import endContract from '../../snapshots/e6a72e8efec4431ef4f64f9b521cff9b4fc8a607795a4c8d02055630485aad8e/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'dosen',
        column: col('pendidikanS1', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'dosen',
        column: col('pendidikanS2', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'dosen',
        column: col('pendidikanS3', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
