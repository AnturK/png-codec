import { EncodeError } from '../../encode/assert.js';
import { IEncodeContext, IImage32, IImage64 } from '../../shared/types.js';
import { writeChunkDataFn } from '../write.js';
import * as pako from 'pako';

export function encodeChunk(
  ctx: IEncodeContext,
  image: Readonly<IImage32> | Readonly<IImage64>,
  keyword: string,
  text: string
): Uint8Array {
  if (keyword.length === 0 || keyword.length > 79) {
    throw new EncodeError(`zTXt: Invalid keyword length: 0 < ${keyword.length} < 80`, 0);
  }

  // Format:
  // Keyword:            1-79 bytes (character string)
  // Null separator:     1 byte (null character)
  // Compression method: 1 byte (0)
  // Text:               0 or more bytes
  const encodedText = pako.deflate(text);
  const dataLength = keyword.length + 1 + 1 + encodedText.length;
  return writeChunkDataFn('zTXt', dataLength, stream => {
    let i = 0;
    // Keyword
    for (; i < keyword.length; i++) {
      stream.writeUint8(keyword.charCodeAt(i));
    }
    // Null separator
    stream.writeUint8(0);
    // Compression method
    stream.writeUint8(0);
    // Text
    stream.writeArray(encodedText);
  });
}
