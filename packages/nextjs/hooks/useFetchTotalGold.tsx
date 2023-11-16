import { formatEther } from "viem";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";

/** Hook for fetching total gold including raw tokens and vault assets
 * @param address the address of the account
 * @returns the total gold for a particular account address
 */

export function useFetchTotalGold(address: string) {
  const { data: lowRiskAssets } = useScaffoldContractRead({
    contractName: "LowRiskVault",
    functionName: "maxWithdraw",
    args: [address],
  });

  const { data: mediumRiskAssets } = useScaffoldContractRead({
    contractName: "MediumRiskVault",
    functionName: "maxWithdraw",
    args: [address],
  });

  const { data: highRiskAssets } = useScaffoldContractRead({
    contractName: "HighRiskVault",
    functionName: "maxWithdraw",
    args: [address],
  });

  const { data: goldReserves } = useScaffoldContractRead({
    contractName: "GoldToken",
    functionName: "balanceOf",
    args: [address],
  });

  const rawTotal = (lowRiskAssets || 0n) + (mediumRiskAssets || 0n) + (highRiskAssets || 0n) + (goldReserves || 0n);
  const formattedTotal = +formatEther(rawTotal);

  return formattedTotal;
}
