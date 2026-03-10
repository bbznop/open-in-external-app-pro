import { constants as FS_CONSTANTS } from 'node:fs';
import fs from 'node:fs/promises';

export function pathExists(path: string) {
    return fs
        .access(path, FS_CONSTANTS.F_OK)
        .then(() => true)
        .catch(() => false);
}

export function isDirectory(path: string) {
    return fs
        .stat(path)
        .then((stat) => stat.isDirectory())
        .catch(() => false);
}
