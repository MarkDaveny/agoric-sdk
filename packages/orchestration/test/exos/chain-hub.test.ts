/* eslint-disable @jessie.js/safe-await-separator -- XXX irrelevant for tests */
import '@agoric/swingset-liveslots/tools/prepare-test-env.js';
import test from '@endo/ses-ava/prepare-endo.js';

import { makeNameHubKit } from '@agoric/vats';
import { prepareSwingsetVowTools } from '@agoric/vow/vat.js';
import { makeChainHub } from '../../src/exos/chain-hub.js';
import { provideDurableZone } from '../supports.js';

const connection = {
  id: 'connection-1',
  client_id: '07-tendermint-3',
  counterparty: {
    client_id: '07-tendermint-2',
    connection_id: 'connection-1',
    prefix: {
      key_prefix: '',
    },
  },
  state: 3 /* IBCConnectionState.STATE_OPEN */,
  transferChannel: {
    portId: 'transfer',
    channelId: 'channel-1',
    counterPartyChannelId: 'channel-1',
    counterPartyPortId: 'transfer',
    ordering: 1 /* Order.ORDER_UNORDERED */,
    state: 3 /* IBCConnectionState.STATE_OPEN */,
    version: 'ics20-1',
  },
} as const;

test('getConnectionInfo', async t => {
  const zone = provideDurableZone('root');
  const vt = prepareSwingsetVowTools(zone);
  const { nameHub } = makeNameHubKit();
  const chainHub = makeChainHub(nameHub, zone);

  const aChain = { chainId: 'a-1' };
  const bChain = { chainId: 'b-2' };

  chainHub.registerConnection(aChain.chainId, bChain.chainId, connection);

  // Look up by string or info object
  t.deepEqual(
    await vt.when(chainHub.getConnectionInfo(aChain.chainId, bChain.chainId)),
    connection,
  );
  t.deepEqual(
    await vt.when(chainHub.getConnectionInfo(aChain, bChain)),
    connection,
  );
});
