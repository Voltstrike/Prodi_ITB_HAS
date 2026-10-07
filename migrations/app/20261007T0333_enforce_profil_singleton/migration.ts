#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/844d5916c1dcf1c23ab547ce4d21f2ae704767ab0135da47f529d00af39a1fcf/contract';
import endContract from '../../snapshots/844d5916c1dcf1c23ab547ce4d21f2ae704767ab0135da47f529d00af39a1fcf/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/dd5cf1224215b638d9ff65ef3fd6f1f3a1a3e637ef4811cd36bcb33ca9d96033/contract';
import startContract from '../../snapshots/dd5cf1224215b638d9ff65ef3fd6f1f3a1a3e637ef4811cd36bcb33ca9d96033/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'profil',
        column: col('singletonKey', 'int4', {
          notNull: true,
          default: lit(1),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'profil',
        constraint: 'profil_singleton_key_dbdbc99e',
        expression: '"singletonKey" = 1',
      }),
      this.addUnique({
        schema: 'public',
        table: 'profil',
        constraint: 'profil_singletonKey_key',
        columns: ['singletonKey'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
