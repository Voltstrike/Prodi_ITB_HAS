#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/844d5916c1dcf1c23ab547ce4d21f2ae704767ab0135da47f529d00af39a1fcf/contract';
import startContract from '../../snapshots/844d5916c1dcf1c23ab547ce4d21f2ae704767ab0135da47f529d00af39a1fcf/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/997c2bbd9dc71b8b4d795c3c376a426c5b42dc7a325a5e71fe05469a1243f434/contract';
import endContract from '../../snapshots/997c2bbd9dc71b8b4d795c3c376a426c5b42dc7a325a5e71fe05469a1243f434/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createIndex({
        schema: 'public',
        table: 'adminSession',
        index: 'adminSession_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'auditLog',
        index: 'auditLog_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'adminSession',
        foreignKey: {
          name: 'adminSession_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'adminUser', columns: ['id'] },
          onDelete: 'cascade',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'auditLog',
        foreignKey: {
          name: 'auditLog_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'adminUser', columns: ['id'] },
          onDelete: 'restrict',
          onUpdate: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
