#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/8ec48a632d3db18aeee5d2d92e2e1bbc24d27874100760dd3071a23c44e48e45/contract';
import startContract from '../../snapshots/8ec48a632d3db18aeee5d2d92e2e1bbc24d27874100760dd3071a23c44e48e45/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/dd5cf1224215b638d9ff65ef3fd6f1f3a1a3e637ef4811cd36bcb33ca9d96033/contract';
import endContract from '../../snapshots/dd5cf1224215b638d9ff65ef3fd6f1f3a1a3e637ef4811cd36bcb33ca9d96033/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addUnique({
        schema: 'public',
        table: 'dosen',
        constraint: 'dosen_nidn_key',
        columns: ['nidn'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
