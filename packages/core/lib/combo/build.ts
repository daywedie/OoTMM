import childProcess from 'child_process';
import fs from 'fs';
import path from 'path';

import { Options } from './options';
import { fileExists } from './util';

const cloneDependencies = async () => {
  const thirdPartyDir = path.resolve('third_party');
  const stampFile = path.resolve(thirdPartyDir, '.stamp');
  if (await fileExists(stampFile))
    return;

  await fs.promises.mkdir(thirdPartyDir, { recursive: true });

  return new Promise((resolve, reject) => {
    const proc = childProcess.spawn('git', ['clone', '--depth', '50', 'https://github.com/decompals/ultralib', thirdPartyDir + '/ultralib'], { stdio: 'inherit' });
    proc.on('close', async (code) => {
      if (code !== 0)
        return reject(new Error(`git clone failed with code ${code}`));

      /* Criar stubs de headers */
      const includeDir = path.resolve(thirdPartyDir, 'ultralib/include');
      await fs.promises.mkdir(includeDir, { recursive: true });

      await fs.promises.writeFile(path.resolve(includeDir, 'stddef.h'), `#ifndef _STDDEF_H_
#define _STDDEF_H_

typedef unsigned int size_t;
typedef int ptrdiff_t;
#define NULL ((void*)0)
#define offsetof(type, member) __builtin_offsetof(type, member)

#endif /* _STDDEF_H_ */
`);

      await fs.promises.writeFile(path.resolve(includeDir, 'stdint.h'), `#ifndef _STDINT_H_
#define _STDINT_H_

typedef signed char int8_t;
typedef unsigned char uint8_t;
typedef signed short int16_t;
typedef unsigned short uint16_t;
typedef signed int int32_t;
typedef unsigned int uint32_t;
typedef signed long long int64_t;
typedef unsigned long long uint64_t;

typedef int8_t int_least8_t;
typedef uint8_t uint_least8_t;
typedef int16_t int_least16_t;
typedef uint16_t uint_least16_t;
typedef int32_t int_least32_t;
typedef uint32_t uint_least32_t;
typedef int64_t int_least64_t;
typedef uint64_t uint_least64_t;

typedef int32_t intptr_t;
typedef uint32_t uintptr_t;

#endif /* _STDINT_H_ */
`);

      await fs.promises.writeFile(path.resolve(includeDir, 'string.h'), `#ifndef _STRING_H_
#define _STRING_H_

#include <stddef.h>

void *memset(void *s, int c, size_t n);
void *memcpy(void *dest, const void *src, size_t n);
void *memmove(void *dest, const void *src, size_t n);
int memcmp(const void *s1, const void *s2, size_t n);
size_t strlen(const char *s);
char *strcpy(char *dest, const char *src);
char *strncpy(char *dest, const char *src, size_t n);
char *strcat(char *dest, const char *src);
char *strncat(char *dest, const char *src, size_t n);
int strcmp(const char *s1, const char *s2);
int strncmp(const char *s1, const char *s2, size_t n);
char *strchr(const char *s, int c);
char *strrchr(const char *s, int c);
char *strstr(const char *haystack, const char *needle);
size_t strspn(const char *s, const char *accept);
size_t strcspn(const char *s, const char *reject);
char *strpbrk(const char *s, const char *accept);
char *strtok(char *str, const char *delim);

#endif /* _STRING_H_ */
`);

      await fs.promises.writeFile(path.resolve(includeDir, 'strings.h'), `#ifndef _STRINGS_H_
#define _STRINGS_H_

#include <stddef.h>

void bzero(void *s, size_t n);
void bcopy(const void *src, void *dest, size_t n);
int bcmp(const void *s1, const void *s2, size_t n);

#endif /* _STRINGS_H_ */
`);

      await fs.promises.writeFile(path.resolve(includeDir, 'stdlib.h'), `#ifndef _STDLIB_H_
#define _STDLIB_H_

#include <stddef.h>

void *malloc(size_t size);
void free(void *ptr);
void *calloc(size_t nmemb, size_t size);
void *realloc(void *ptr, size_t size);
void exit(int status);
int atoi(const char *nptr);
long strtol(const char *nptr, char **endptr, int base);
unsigned long strtoul(const char *nptr, char **endptr, int base);
int rand(void);
void srand(unsigned int seed);
int abs(int j);
long labs(long j);

#endif /* _STDLIB_H_ */
`);

      await fs.promises.writeFile(stampFile, '');
      resolve(null);
    });
  });
};

async function runCommand(cmd: string, args: string[]) {
  return new Promise((resolve, reject) => {
    const proc = childProcess.spawn(cmd, args, { stdio: 'inherit' });
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(null);
      } else {
        reject(new Error(`${cmd} exited with code ${code}`));
      }
    });
  });
}

export async function build(opts: Options) {
  /* Clone dependencies */
  await cloneDependencies();

  /* Resolve paths */
  const installDir = path.resolve(__dirname, '..', '..', 'build');
  const buildDir = path.resolve(installDir, 'tree', opts.debug ? 'Debug' : 'Release');
  const sourceDir = path.resolve(__dirname, '..', '..');
  const binDir = path.resolve(installDir, 'bin');
  const ovlDir = path.resolve(binDir, 'ovl');

  /* Remove old overlays */
  await fs.promises.rm(ovlDir, { recursive: true, force: true });

  /* Make directories */
  await fs.promises.mkdir(buildDir, { recursive: true });
  await fs.promises.mkdir(installDir, { recursive: true });

  /* Build and install with CMake */
  await runCommand('cmake', [
    '-B', buildDir,
    '-S', sourceDir,
    '-G', 'Ninja',
    `-DCMAKE_BUILD_TYPE=${opts.debug ? 'Debug' : 'Release'}`,
    '-DCMAKE_C_COMPILER=/opt/libdragon/bin/mips64-elf-gcc',
    '-DCMAKE_ASM_COMPILER=/opt/libdragon/bin/mips64-elf-gcc',
    '-DCMAKE_C_FLAGS=-nostdinc',
    '-DCMAKE_ASM_FLAGS=-nostdinc'
  ]);
  await runCommand('cmake', ['--build', buildDir]);
  await runCommand('cmake', ['--install', buildDir, '--prefix', installDir]);

  return binDir;
}