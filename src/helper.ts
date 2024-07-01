import { PENDLE_POOL_ADDRESSES } from "./consts.ts";
import { EthContext } from "@sentio/sdk/eth";
import { AccountSnapshot } from "./schema/schema.ts"
import os from 'os';

export function isPendleAddress(addr: string) {
    addr = addr.toLowerCase();
    return addr == PENDLE_POOL_ADDRESSES.SY ||
        addr == PENDLE_POOL_ADDRESSES.YT ||
        addr == PENDLE_POOL_ADDRESSES.LP;
}

export function getUnixTimestamp(date: Date) {
    return Math.floor(date.getTime() / 1000);
}

export function isSentioInternalError(err: any): boolean {
    if (
        err.code === os.constants.errno.ECONNRESET ||
        err.code === os.constants.errno.ECONNREFUSED ||
        err.code === os.constants.errno.ECONNABORTED ||
        err.toString().includes('ECONNREFUSED') ||
        err.toString().includes('ECONNRESET') ||
        err.toString().includes('ECONNABORTED')
    ) {
        return true;
    }
    return false;
}

export async function listSnapshots(ctx : EthContext, label : string) : Promise<AccountSnapshot[]> {
    return ctx.store.list(AccountSnapshot, [{
        field: 'label',
        op: 'like',
        value: label
    }]);
}

export async function getSnapshot(ctx : EthContext, id : string, label : string) : Promise<AccountSnapshot[]> {
    return await ctx.store.list(AccountSnapshot, [{
        field: 'label',
        op: 'like',
        value: label
    },
    {
        field: 'id',
        op: 'like',
        value: id
    }]);
}