import { parseUnits } from "viem";
import { useAccount } from "wagmi";
import { useDeployedContractInfo, useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

export interface IVaultManager {
  address: string | undefined;
  totalAssets: bigint | undefined;
  totalSupply: bigint | undefined;
  maxWithdraw: bigint | undefined;
  maxRedeem: bigint | undefined;
  depositAmount: string;
  approve: () => Promise<void>;
  deposit: () => Promise<void>;
  withdrawAmount: string;
  withdraw: () => Promise<void>;
  minimumROI: bigint | undefined;
  maximumROI: bigint | undefined;
}

type VaultContractNames = "HighRiskVault" | "LowRiskVault" | "MediumRiskVault";

/** Hook for interacting with vault contracts
 *
 * @param vaultContractName the name of the vault contract to interact with
 * @param depositAmount human readable amount of GLD to deposit
 * @param withdrawAmount human readable amount of GLD to withdraw
 * @returns
 */

export function useVaultManager(
  vaultContractName: VaultContractNames,
  depositAmount: string,
  withdrawAmount: string,
): IVaultManager {
  const account = useAccount();

  const { data: vaultContract } = useDeployedContractInfo(vaultContractName);

  const { data: minimumROI } = useScaffoldContractRead({
    contractName: vaultContractName,
    functionName: "MINIMUM_ROI_PERCENTAGE",
  });

  const { data: maximumROI } = useScaffoldContractRead({
    contractName: vaultContractName,
    functionName: "MAXIMUM_ROI_PERCENTAGE",
  });

  const { data: totalAssets } = useScaffoldContractRead({
    contractName: vaultContractName,
    functionName: "totalAssets",
  });

  const { data: totalSupply } = useScaffoldContractRead({
    contractName: vaultContractName,
    functionName: "totalSupply",
  });

  const { data: maxWithdraw } = useScaffoldContractRead({
    contractName: vaultContractName,
    functionName: "maxWithdraw",
    args: [account.address],
  });

  const { data: maxRedeem } = useScaffoldContractRead({
    contractName: vaultContractName,
    functionName: "maxRedeem",
    args: [account.address],
  });

  const { writeAsync: approve } = useScaffoldContractWrite({
    contractName: "GoldToken",
    functionName: "approve",
    args: [vaultContract?.address, parseUnits(depositAmount, 18)],
  });

  const { writeAsync: deposit } = useScaffoldContractWrite({
    contractName: vaultContractName,
    functionName: "deposit",
    args: [parseUnits(depositAmount, 18), account.address],
  });

  const { writeAsync: withdraw } = useScaffoldContractWrite({
    contractName: vaultContractName,
    functionName: "withdraw",
    args: [parseUnits(withdrawAmount, 18), account.address, account.address],
  });

  return {
    address: vaultContract?.address,
    totalAssets,
    totalSupply,
    maxWithdraw,
    maxRedeem,
    approve,
    deposit,
    depositAmount,
    withdraw,
    withdrawAmount,
    minimumROI,
    maximumROI,
  };
}
