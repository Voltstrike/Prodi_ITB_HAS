#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/6f96652b8d54ba5b5f57167fb784ed0d1b3f5ea69945373c0a6587fee45c200f/contract';
import endContract from '../../snapshots/6f96652b8d54ba5b5f57167fb784ed0d1b3f5ea69945373c0a6587fee45c200f/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/e8fcd2b10468ca2981299b6aaef8dc26e060a1266883473fe854c17b0d0cd2f3/contract';
import startContract from '../../snapshots/e8fcd2b10468ca2981299b6aaef8dc26e060a1266883473fe854c17b0d0cd2f3/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'profil',
        column: col('strukturOrganisasi', 'jsonb', { codecRef: { codecId: 'pg/jsonb@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
