#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/0198f424bbcc7c8aa2703584bf4046eebdd6fb850e02e5327ffc4c6575ec7dc8/contract';
import endContract from '../../snapshots/0198f424bbcc7c8aa2703584bf4046eebdd6fb850e02e5327ffc4c6575ec7dc8/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/f929bf125681fe8399be014a99b7d8641b7892836ca69527a288089ae71652bf/contract';
import startContract from '../../snapshots/f929bf125681fe8399be014a99b7d8641b7892836ca69527a288089ae71652bf/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'adminMfa',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('enabledAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('failedAttempts', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('firstFailedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('lastUsedStep', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('pendingExpiresAt', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('pendingSecretEncrypted', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('pendingSessionTokenHash', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('secretEncrypted', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('version', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'adminMfaRecoveryCode',
        columns: [
          col('codeHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'adminSession',
        column: col('mfaVersion', 'int4', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'adminMfa',
        constraint: 'adminMfa_userId_key',
        columns: ['userId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'adminMfaRecoveryCode',
        constraint: 'adminMfaRecoveryCode_codeHash_key',
        columns: ['codeHash'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'adminMfaRecoveryCode',
        index: 'adminMfaRecoveryCode_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'adminMfa',
        foreignKey: {
          name: 'adminMfa_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'adminUser', columns: ['id'] },
          onDelete: 'cascade',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'adminMfaRecoveryCode',
        foreignKey: {
          name: 'adminMfaRecoveryCode_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'adminUser', columns: ['id'] },
          onDelete: 'cascade',
          onUpdate: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
