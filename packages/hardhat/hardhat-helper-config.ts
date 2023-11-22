interface NetworkConfigEntryTypes {
  name: string;
  vrfCoordinatorAddress: string;
  subscriptionId: string;
  requestConfirmations: string;
  callbackGasLimit: string;
  keyHash: string;
}

/**
 * @notice https://docs.chain.link/vrf/v2/subscription/supported-networks/#polygon-matic-mumbai-testnet
 */

const networkConfig: { [key: number]: NetworkConfigEntryTypes } = {
  80001: {
    name: "polygonMumbai",
    vrfCoordinatorAddress: "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed",
    keyHash: "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
    subscriptionId: "6468", // https://vrf.chain.link/mumbai
    requestConfirmations: "3", // 3 is mininum allowed
    callbackGasLimit: "2250000", // 2,255,000 (must be less than max of 2.5 million)
  },
};

const developmentChains: string[] = ["hardhat", "foundry", "localhost"];

export { networkConfig, developmentChains };
