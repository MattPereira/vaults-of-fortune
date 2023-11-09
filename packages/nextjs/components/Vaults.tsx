import { ChangeEvent, useState } from "react";
import Image from "next/image";
import { formatEther, formatUnits, parseUnits } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

export const Vaults = () => {
  const [lowRiskDepositAmount, setLowRiskDepositAmount] = useState("0");
  const [depositPercentage, setDepositPercentage] = useState(0);

  // the currently connected account
  const account = useAccount();
  console.log(account.address);

  const { data: userGoldBalance } = useScaffoldContractRead({
    contractName: "GoldToken",
    functionName: "balanceOf",
    args: [account.address],
  });

  console.log("userGoldBalance", userGoldBalance);

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
    args: [parseUnits(lowRiskDepositAmount, 18), account.address],
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

  const { data: highRiskTotalAssets } = useScaffoldContractRead({
    contractName: "HighRiskVault",
    functionName: "totalAssets",
  });

  const { data: highRiskTotalSupply } = useScaffoldContractRead({
    contractName: "HighRiskVault",
    functionName: "totalSupply",
  });

  const vaults = [
    { title: "Low Risk", totalAssets: lowRiskTotalAssets, totalSupply: lowRiskTotalSupply },
    { title: "Medium Risk", totalAssets: mediumRiskTotalAssets, totalSupply: mediumRiskTotalSupply },
    { title: "High Risk", totalAssets: highRiskTotalAssets, totalSupply: highRiskTotalSupply },
  ];

  const handleDepositLowRisk = (event: ChangeEvent<HTMLInputElement>) => {
    const percentage = +event.target.value;
    setDepositPercentage(percentage);
    const amount = (percentage * Number(formatEther(userGoldBalance || 0n))) / 100;
    setLowRiskDepositAmount(amount.toString());

    console.log(lowRiskDepositAmount);
  };

  return (
    <>
      {vaults.map(vault => (
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
              <input
                type="range"
                min={0}
                max="100"
                value={depositPercentage}
                onChange={handleDepositLowRisk}
                className="range"
              />
              <button className="btn btn-accent w-28" onClick={() => depositLowRisk()}>
                Deposit
              </button>
            </div>
            <div className="flex items-center gap-4">
              <input type="range" min={0} max="100" value="40" className="range" />
              <button className="btn btn-accent w-28">Redeem</button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};
