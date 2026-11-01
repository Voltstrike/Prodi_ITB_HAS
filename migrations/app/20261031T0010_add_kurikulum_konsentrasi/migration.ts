#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/9c136552c5e895399a23730ec3b8c8456c832f9c391ca2664db32d6d09f3f9ed/contract';
import startContract from '../../snapshots/9c136552c5e895399a23730ec3b8c8456c832f9c391ca2664db32d6d09f3f9ed/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/cb6e6bd3cf79cac95db144530d89d85c098d9763461887e9a856c9e65c7ee9f3/contract';
import endContract from '../../snapshots/cb6e6bd3cf79cac95db144530d89d85c098d9763461887e9a856c9e65c7ee9f3/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'kurikulum',
        column: col('konsentrasi', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
