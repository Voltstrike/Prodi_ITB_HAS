#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/c987cb0d8039515bf2d69672f058cd4170643ea45256f4fd0762aeb549868cc6/contract';
import startContract from '../../snapshots/c987cb0d8039515bf2d69672f058cd4170643ea45256f4fd0762aeb549868cc6/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/f929bf125681fe8399be014a99b7d8641b7892836ca69527a288089ae71652bf/contract';
import endContract from '../../snapshots/f929bf125681fe8399be014a99b7d8641b7892836ca69527a288089ae71652bf/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'dokumenKurikulum',
        column: col('kategori', 'text', {
          notNull: true,
          default: lit('KURIKULUM'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'dokumenKurikulum',
        constraint: 'dokumen_kurikulum_kategori_ae7de11f',
        expression: "\"kategori\" IN ('KURIKULUM', 'PANDUAN_TESIS', 'DESKRIPSI_KONSENTRASI')",
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
