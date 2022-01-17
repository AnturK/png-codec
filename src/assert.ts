/**
 * @license
 * Copyright (c) 2022 Daniel Imms <http://www.growingwiththeweb.com>
 * Released under MIT license. See LICENSE in the project root for details.
 */

import { ChunkPartByteLength, IDecodeContext, IPngChunk, KnownChunkTypes } from './types.js';

/**
 * Assert the given chunk type already exists.
 * @param ctx The decode context.
 * @param chunk The chunk being checked.
 */
export function assertChunkSinglular(ctx: IDecodeContext, chunk: IPngChunk) {
  if (ctx.parsedChunks.has(chunk.type)) {
    handleWarning(ctx, createChunkDecodeWarning(chunk, `Multiple ${chunk.type} chunks not allowed`, chunk.offset + ChunkPartByteLength.Length));
  }
}

/**
 * Assert a chunk's data length does not equal an expected value.
 * @param ctx The decode context.
 * @param chunk The chunk being checked.
 * @param expected The expected data length of the chunk.
 */
export function assertChunkDataLengthEquals(ctx: IDecodeContext, chunk: IPngChunk, expected: number) {
  if (chunk.dataLength !== expected) {
    const error = createChunkDecodeWarning(chunk, `Invalid data length: ${chunk.dataLength} !== ${expected}`, chunk.offset);
    // Only warn if the data is larger
    if (chunk.dataLength > expected) {
      handleWarning(ctx, error);
    } else {
      throw error;
    }
  }
}

/**
 * Assert a chunk's data length is greater than an expected value.
 * @param chunk The chunk being checked.
 * @param expected The expected data length of the chunk.
 */
export function assertChunkDataLengthGte(ctx: IDecodeContext, chunk: IPngChunk, expected: number) {
  if (chunk.dataLength < expected) {
    throw createChunkDecodeError(ctx, chunk, `Invalid data length: ${chunk.dataLength} < ${expected}`, chunk.offset);
  }
}

/**
 * Assert the chunk precedes another chunk type, ie. the other chunk type has not yet been parsed.
 * @param ctx The decode context.
 * @param chunk The chunk being checked.
 * @param typeAfter The chunk type that `type` must precede.
 */
export function assertChunkPrecedes(ctx: IDecodeContext, chunk: IPngChunk, typeAfter: KnownChunkTypes) {
  if (ctx.parsedChunks.has(typeAfter)) {
    handleWarning(ctx, createChunkDecodeWarning(chunk, `Must precede ${typeAfter}`, chunk.offset + ChunkPartByteLength.Length));
  }
}

/**
 * Assert the chunk follows another chunk type, ie. the other chunk type has not yet been parsed.
 * @param ctx The decode context.
 * @param chunk The chunk being checked.
 * @param typeAfter The chunk type that `type` must precede.
 */
export function assertChunkFollows(ctx: IDecodeContext, chunk: IPngChunk, typeAfter: KnownChunkTypes) {
  // Follows assertions are always errors by design
  if (!ctx.parsedChunks.has(typeAfter)) {
    throw createChunkDecodeError(ctx, chunk, `Must follow ${typeAfter}`, chunk.offset + ChunkPartByteLength.Length);
  }
}

/**
 * Assert the chunk does not exist alongside another chunk type, ie. the other chunk type has not yet been parsed.
 * @param ctx The decode context.
 * @param chunk The chunk being checked.
 * @param otherType The chunk type that cannot be existed beside.
 */
export function assertChunkMutualExclusion(ctx: IDecodeContext, chunk: IPngChunk, otherType: KnownChunkTypes) {
  if (ctx.parsedChunks.has(otherType)) {
    handleWarning(ctx, createChunkDecodeWarning(chunk, `Should not be present alongside ${otherType}`, chunk.offset + ChunkPartByteLength.Length));
  }
}
/**
 * Assert the chunk compression method is valid.
 * @param ctx The decode context.
 * @param chunk The chunk being checked.
 * @param compressionMethod The chunk's compression method, only `0` (zlib datastream with deflate
 * compression) is valid.
 */
export function assertChunkCompressionMethod(ctx: IDecodeContext, chunk: IPngChunk, compressionMethod: number, offset: number) {
  if (compressionMethod !== 0) {
    handleWarning(ctx, createChunkDecodeWarning(chunk, `Unknown compression method "${compressionMethod}"`, offset));
  }
}

export function createChunkDecodeError(ctx: IDecodeContext, chunk: IPngChunk, message: string, offset: number): DecodeError {
  return new DecodeError(ctx, `${chunk.type}: ${message}`, offset);
}

export class DecodeError extends Error {
  readonly warnings: DecodeWarning[];
  constructor(
    ctx: Pick<IDecodeContext, 'warnings'>,
    message: string,
    readonly offset: number
  ) {
    super(message);
    this.warnings = ctx.warnings;
  }
}

export function createChunkDecodeWarning(chunk: IPngChunk, message: string, offset: number): DecodeWarning {
  return new DecodeWarning(`${chunk.type}: ${message}`, offset);
}

export class DecodeWarning extends Error {
  constructor(message: string, readonly offset: number) {
    super(message);
  }
}

/**
 * Handles an error, throwing in strict mode or adding to the warnings array otherwise.
 * @param ctx The decode context.
 * @param error The error to handle.
 */
export function handleWarning(ctx: IDecodeContext, error: DecodeWarning) {
  if (ctx.options.strictMode) {
    throw error;
  }
  ctx.warnings.push(error);
}
