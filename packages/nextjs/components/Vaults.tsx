import { ChangeEvent, useState } from "react";
import Image from "next/image";
import { formatEther, formatUnits, parseUnits } from "viem";
import { useAccount } from "wagmi";
import { useDeployedContractInfo, useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

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

  // ContractName: name of the deployed contract
  const { data: lowRiskVaultContract } = useDeployedContractInfo("LowRiskVault");
  const { data: mediumRiskVaultContract } = useDeployedContractInfo("MediumRiskVault");
  const { data: highRiskVaultContract } = useDeployedContractInfo("HighRiskVault");

  const {
    writeAsync: approve,
    // isLoading,
    // isMining,
  } = useScaffoldContractWrite({
    contractName: "GoldToken",
    functionName: "approve",
    args: ["0x", 0n],
  });

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
      handleDepositTx: async () => {
        await approve({ args: [lowRiskVaultContract?.address, parseUnits(depositState.lowRisk.amount, 18)] });
        await depositLowRisk();
        setDepositState(prevState => ({
          ...prevState,
          lowRisk: {
            percentage: 0,
            amount: "0",
          },
        }));
      },
    },
    {
      key: "mediumRisk",
      title: "Medium Risk",
      totalAssets: mediumRiskTotalAssets,
      totalSupply: mediumRiskTotalSupply,
      depositAmount: depositState.mediumRisk.amount,
      depositPercentage: depositState.mediumRisk.percentage,
      handleDepositTx: async () => {
        await approve({ args: [mediumRiskVaultContract?.address, parseUnits(depositState.mediumRisk.amount, 18)] });
        await depositMediumRisk();
        setDepositState(prevState => ({
          ...prevState,
          mediumRisk: {
            percentage: 0,
            amount: "0",
          },
        }));
      },
    },
    {
      key: "highRisk",
      title: "High Risk",
      totalAssets: highRiskTotalAssets,
      totalSupply: highRiskTotalSupply,
      depositAmount: depositState.highRisk.amount,
      depositPercentage: depositState.highRisk.percentage,
      handleDepositTx: async () => {
        await approve({ args: [highRiskVaultContract?.address, parseUnits(depositState.highRisk.amount, 18)] });

        await depositHighRisk(),
          setDepositState(prevState => ({
            ...prevState,
            highRisk: {
              percentage: 0,
              amount: "0",
            },
          }));
      },
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

  return (
    <>
      {vaults.map(vault => {
        return (
          <div key={vault.title}>
            <h2 className="mb-5 text-4xl font-cubano">{vault.title}</h2>
            <div className="flex gap-8 flex-wrap mb-10">
              <div>
                <div className="rounded-2xl overflow-hidden">
                  <Image src="/vault.png" width="250" height="250" alt="cartoon vault" />
                </div>
              </div>

              <div className="flex flex-col gap-8 grow justify-center">
                <div className="flex items-center gap-8">
                  <div>
                    <div className="stats shadow">
                      <div className="stat">
                        <div className="stat-title">Total Assets</div>
                        <div className="stat-value text-white text-2xl">
                          {formatUnits(vault.totalAssets || 0n, 18)} GLD
                        </div>
                      </div>
                      <div className="stat">
                        <div className="stat-title">Total Supply</div>
                        <div className="stat-value text-white text-2xl">
                          {formatUnits(vault.totalSupply || 0n, 18)} Shares
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full">
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
                      <div className="flex justify-center">
                        <div className="mr-1">{Number(vault.depositAmount).toFixed(2)}</div>GLD
                      </div>
                      <button className="btn btn-accent w-28" onClick={vault.handleDepositTx}>
                        Deposit
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div>
                    <div className="stats shadow">
                      <div className="stat">
                        <div className="stat-title">Your Assets</div>
                        <div className="stat-value text-white text-2xl">
                          {formatUnits(vault.totalAssets || 0n, 18)} GLD
                        </div>
                      </div>
                      <div className="stat">
                        <div className="stat-title">Your Supply</div>
                        <div className="stat-value text-white text-2xl">
                          {formatUnits(vault.totalSupply || 0n, 18)} Shares
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full">
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
                      <div className="flex justify-center">
                        <div className="mr-1">{Number(vault.depositAmount).toFixed(2)}</div>GLD
                      </div>
                      <button className="btn btn-accent w-28" onClick={vault.handleDepositTx}>
                        Withdraw
                      </button>
                    </div>
                  </div>
                </div>

                {/* <div className="flex items-center gap-4">
                <input type="range" min={0} max="100" value="40" className="range" />
                <button className="btn btn-accent w-28">Redeem</button>
              </div> */}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};
