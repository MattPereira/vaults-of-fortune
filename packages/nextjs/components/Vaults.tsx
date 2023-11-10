import { ChangeEvent, useState } from "react";
import Image from "next/image";
import { formatEther, formatUnits, parseUnits } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

export const Vaults = () => {
  const [depositState, setDepositState] = useState({
    lowRisk: { amount: "0", percentage: 0 },
    mediumRisk: { amount: "0", percentage: 0 },
    highRisk: { amount: "0", percentage: 0 },
  });

  // the currently connected account
  const account = useAccount();

  const { data: userGoldBalance } = useScaffoldContractRead({
    contractName: "GoldToken",
    functionName: "balanceOf",
    args: [account.address],
  });

  //   const {
  //     writeAsync: approve,
  //     // isLoading,
  //     // isMining,
  //   } = useScaffoldContractWrite({
  //     contractName: "GoldToken",
  //     functionName: "approve",
  //     args: [spender, amount],
  //     blockConfirmations: 1,
  //   });

  const { data: lowRiskTotalAssets } = useScaffoldContractRead({
    contractName: "LowRiskVault",
    functionName: "totalAssets",
  });

  const { data: lowRiskTotalSupply } = useScaffoldContractRead({
    contractName: "LowRiskVault",
    functionName: "totalSupply",
  });

  const {
    writeAsync: depositLowRisk,
    // isLoading,
    // isMining,
  } = useScaffoldContractWrite({
    contractName: "LowRiskVault",
    functionName: "deposit",
    args: [parseUnits(depositState.lowRisk.amount, 18), account.address],
    blockConfirmations: 1,
  });

  const { data: mediumRiskTotalAssets } = useScaffoldContractRead({
    contractName: "MediumRiskVault",
    functionName: "totalAssets",
  });

  const { data: mediumRiskTotalSupply } = useScaffoldContractRead({
    contractName: "MediumRiskVault",
    functionName: "totalSupply",
  });

  const {
    writeAsync: depositMediumRisk,
    // isLoading,
    // isMining,
  } = useScaffoldContractWrite({
    contractName: "MediumRiskVault",
    functionName: "deposit",
    args: [parseUnits(depositState.mediumRisk.amount, 18), account.address],
    blockConfirmations: 1,
  });

  const { data: highRiskTotalAssets } = useScaffoldContractRead({
    contractName: "HighRiskVault",
    functionName: "totalAssets",
  });

  const { data: highRiskTotalSupply } = useScaffoldContractRead({
    contractName: "HighRiskVault",
    functionName: "totalSupply",
  });

  const {
    writeAsync: depositHighRisk,
    // isLoading,
    // isMining,
  } = useScaffoldContractWrite({
    contractName: "HighRiskVault",
    functionName: "deposit",
    args: [parseUnits(depositState.highRisk.amount, 18), account.address],
    blockConfirmations: 1,
  });

  const vaults = [
    {
      key: "lowRisk",
      title: "Low Risk",
      totalAssets: lowRiskTotalAssets,
      totalSupply: lowRiskTotalSupply,
      depositAmount: depositState.lowRisk.amount,
      depositPercentage: depositState.lowRisk.percentage,
      handleDepositTx: () => depositLowRisk(),
    },
    {
      key: "mediumRisk",
      title: "Medium Risk",
      totalAssets: mediumRiskTotalAssets,
      totalSupply: mediumRiskTotalSupply,
      depositAmount: depositState.mediumRisk.amount,
      depositPercentage: depositState.mediumRisk.percentage,
      handleDepositTx: () => depositMediumRisk(),
    },
    {
      key: "highRisk",
      title: "High Risk",
      totalAssets: highRiskTotalAssets,
      totalSupply: highRiskTotalSupply,
      depositAmount: depositState.highRisk.amount,
      depositPercentage: depositState.highRisk.percentage,
      handleDepositTx: () => depositHighRisk(),
    },
  ];

  const handleDepositChange = (event: ChangeEvent<HTMLInputElement>, vaultType: string) => {
    const percentage = +event.target.value;
    const amount = (percentage * Number(formatEther(userGoldBalance || 0n))) / 100;

    setDepositState(prevState => ({
      ...prevState,
      [vaultType]: {
        percentage: percentage,
        amount: amount.toString(),
      },
    }));
  };

  console.log("DEPOSIT STATE", depositState);

  return (
    <>
      {vaults.map(vault => {
        return (
          <div key={vault.title}>
            <h2 className="text-center mb-5 text-4xl font-cubano">{vault.title}</h2>

            <div className="overflow-x-auto flex justify-center">
              <table className="table w-1/2">
                <tbody>
                  <tr>
                    <th>Total Assets</th>
                    <td>{formatUnits(vault.totalAssets || 0n, 18)} GLD</td>
                  </tr>
                  <tr>
                    <th>Total Supply</th>
                    <td>{formatUnits(vault.totalSupply || 0n, 18)} Shares</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex justify-center mb-5">
              <div className="rounded-2xl overflow-hidden">
                <Image src="/vault.png" width="350" height="350" alt="cartoon vault" />
              </div>
            </div>
            <div className="flex flex-col justify-center gap-8">
              <div className="flex items-center gap-4">
                <div className="mr-3">{vault.depositPercentage}%</div>
                <input
                  type="range"
                  min={0}
                  max="100"
                  value={vault.depositPercentage}
                  onChange={event => handleDepositChange(event, vault.key)}
                  className="range"
                />
                <button className="btn btn-accent w-28" onClick={vault.handleDepositTx}>
                  Deposit
                </button>
              </div>
              {/* <div className="flex items-center gap-4">
                <input type="range" min={0} max="100" value="40" className="range" />
                <button className="btn btn-accent w-28">Redeem</button>
              </div> */}
            </div>
          </div>
        );
      })}
    </>
  );
};
