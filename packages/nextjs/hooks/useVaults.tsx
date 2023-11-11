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
  approveAndDeposit: () => Promise<void>;
}

type VaultContractNames = "HighRiskVault" | "LowRiskVault" | "MediumRiskVault";

/** Hook for interacting with vault contracts
 *
 * @param vaultContractName
 * @param depositAmount
 * @param withdrawAmount
 * @returns
 */

export function useVaultManager(vaultContractName: VaultContractNames, depositAmount: string): IVaultManager {
  const account = useAccount();

  const { data: vaultContract } = useDeployedContractInfo(vaultContractName);

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

  const { writeAsync: deposit } = useScaffoldContractWrite({
    contractName: vaultContractName,
    functionName: "deposit",
    args: [parseUnits(depositAmount, 18), account.address],
  });

  const { writeAsync: approve } = useScaffoldContractWrite({
    contractName: "GoldToken",
    functionName: "approve",
    args: [vaultContract?.address, parseUnits(depositAmount, 18)],
  });

  const approveAndDeposit = async () => {
    await approve();
    await deposit();
  };

  return {
    address: vaultContract?.address,
    totalAssets,
    totalSupply,
    maxWithdraw,
    maxRedeem,
    depositAmount,
    approveAndDeposit,
  };
}
