import { ChangeEvent, useState } from "react";
import Image from "next/image";
import { formatEther, formatUnits } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import { IVaultManager, useVaultManager } from "~~/hooks/useVaults";

export const Vaults = () => {
  // State for the deposit inputs
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

  const lowRiskVault = useVaultManager("LowRiskVault", depositState.lowRisk.amount);
  const mediumRiskVault = useVaultManager("MediumRiskVault", depositState.mediumRisk.amount);
  const highRiskVault = useVaultManager("HighRiskVault", depositState.highRisk.amount);

  // refactor this after adding type to depositState
  type VaultKey = keyof typeof depositState;
  type VaultItem = IVaultManager & {
    key: VaultKey;
    title: string;
  };

  const vaults: VaultItem[] = [
    {
      key: "lowRisk",
      title: "Low Risk",
      ...lowRiskVault,
    },
    {
      key: "mediumRisk",
      title: "Medium Risk",
      ...mediumRiskVault,
    },
    {
      key: "highRisk",
      title: "High Risk",
      ...highRiskVault,
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
                      <div className="stat bg-red-600 w-28">
                        <div className="stat-title">Min ROI</div>
                        <div className="stat-value text-white text-xl">+ 2 %</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="stats shadow">
                      <div className="stat w-40">
                        <div className="stat-title">Total Assets</div>
                        <div className="stat-value text-white text-xl">
                          {formatUnits(vault.totalAssets || 0n, 18)} GLD
                        </div>
                      </div>
                      <div className="stat w-40">
                        <div className="stat-title">Total Supply</div>
                        <div className="stat-value text-white text-xl">
                          {formatUnits(vault.totalSupply || 0n, 18)} Shares
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Deposit Interface */}
                  <div className="w-full">
                    <div className="flex items-center gap-4">
                      <div className="mr-3">{depositState[vault.key].percentage}%</div>
                      <input
                        type="range"
                        min={0}
                        max="100"
                        value={depositState[vault.key].percentage}
                        onChange={event => handleDepositChange(event, vault.key)}
                        className="range"
                      />
                      <div className="flex justify-center">
                        <div className="mr-1">{Number(vault.depositAmount).toFixed(2)}</div>GLD
                      </div>
                      <button
                        className="btn btn-accent w-28"
                        onClick={async () => {
                          await vault.approveAndDeposit();
                          setDepositState(prevState => ({
                            ...prevState,
                            [vault.key]: {
                              percentage: 0,
                              amount: "0",
                            },
                          }));
                        }}
                      >
                        Deposit
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div>
                    <div className="stats shadow">
                      <div className="stat bg-green-600 w-28">
                        <div className="stat-title">Max ROI</div>
                        <div className="stat-value text-white text-xl">+ 10 %</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="stats shadow">
                      <div className="stat w-40">
                        <div className="stat-title">Your Assets</div>
                        <div className="stat-value text-white text-xl">
                          {formatUnits(vault.maxWithdraw || 0n, 18)} GLD
                        </div>
                      </div>
                      <div className="stat w-40">
                        <div className="stat-title">Your Supply</div>
                        <div className="stat-value text-white text-xl">
                          {formatUnits(vault.maxRedeem || 0n, 18)} Shares
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Withdraw Interface */}
                  {/* <div className="w-full">
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
                        <div className="mr-1">TODO</div>GLD
                      </div>
                      <button className="btn btn-accent w-28">Withdraw</button>
                    </div>
                  </div> */}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};
