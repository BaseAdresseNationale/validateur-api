// import iconv from 'iconv-lite';
// import Papa, { ParseResult } from 'papaparse';
// import chardet, { AnalyseResult } from 'chardet';
// import fileType from 'file-type';

// const CHARDET_TO_NORMALIZED_ENCODINGS = {
//   'iso-8859-1': 'windows-1252',
//   'iso-8859-15': 'windows-1252',
//   'windows-1252': 'windows-1252',
//   'utf-8': 'utf-8',
// };

// function normalizeEncodingName(encoding: string): string {
//   const lcEncoding = encoding.toLowerCase();
//   if (!(lcEncoding in CHARDET_TO_NORMALIZED_ENCODINGS)) {
//     throw new Error('Encoding currently not supported: ' + encoding);
//   }

//   return CHARDET_TO_NORMALIZED_ENCODINGS[lcEncoding];
// }

// export function detectBufferEncoding(buffer: Buffer): string {
//   if (fileType(buffer)) {
//     throw new Error('Non-text file cannot be processed');
//   }

//   const analyseResults: AnalyseResult = chardet.analyse(buffer);

//   if (analyseResults.length === 0) {
//     throw new Error('Unable to detect encoding');
//   }

//   const utf8Result = analyseResults.find((r) => r.name === 'UTF-8');

//   if (utf8Result && utf8Result.confidence >= 80) {
//     return 'utf-8';
//   }

//   // Pure ASCII
//   if (utf8Result && utf8Result.confidence === 10) {
//     return 'utf-8';
//   }

//   return normalizeEncodingName(analyseResults[0].name);
// }

// const PAPA_OPTIONS = {
//   delimitersToGuess: [',', '\t', ';'],
//   skipEmptyLines: true,
//   header: true,
// };

// function parseCsv(
//   file: string,
//   options = {},
// ): Promise<ParseResult<Record<string, string>>> {
//   return new Promise((resolve, reject) => {
//     Papa.parse<Record<string, string>>(file, {
//       ...PAPA_OPTIONS,
//       ...options,
//       complete: (res) => resolve(res),
//       error: (err) => reject(err),
//     });
//   });
// }

// // Copied from strip-bom package which contains ES6 syntax
// function stripBom(str: string): string {
//   // Catches EFBBBF (UTF-8 BOM) because the buffer-to-string
//   // conversion translates it to FEFF (UTF-16 BOM)
//   return str.codePointAt(0) === 0xfe_ff ? str.slice(1) : str;
// }

// function decodeBuffer(buffer: Buffer) {
//   const encoding: string = detectBufferEncoding(buffer);
//   const decodedString: string = stripBom(iconv.decode(buffer, encoding));
//   return { encoding, decodedString };
// }

// export type ParseReturn = ParseResult<Record<string, string>> & {
//   encoding: string;
// };

// export async function parse(
//   buffer: Buffer,
//   options = {},
// ): Promise<ParseReturn> {
//   const { encoding, decodedString } = decodeBuffer(buffer);
//   const { data, errors, meta }: ParseResult<Record<string, string>> =
//     await parseCsv(decodedString, options);
//   return { data, errors, meta, encoding };
// }
