import { ChangeEvent, useState } from "react";
import Image from "next/image";
import { formatEther, formatUnits } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import { IVaultManager, useVaultManager } from "~~/hooks/useVaults";

/** Component to render the vaults
 *
 * @notice useVaultManger hook is used to interact with the vault contracts
 * @notice only amount matters for the deposit and withdraw state from perspective of tx
 */

export const Vaults = () => {
  const [vaultDeposit, setVaultDeposit] = useState({
    lowRisk: { amount: "0", percentage: 0 },
    mediumRisk: { amount: "0", percentage: 0 },
    highRisk: { amount: "0", percentage: 0 },
  });

  const [vaultWithdraw, setVaultWithdraw] = useState({
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

  const lowRiskVault = useVaultManager("LowRiskVault", vaultDeposit.lowRisk.amount, vaultWithdraw.lowRisk.amount);
  const mediumRiskVault = useVaultManager(
    "MediumRiskVault",
    vaultDeposit.mediumRisk.amount,
    vaultWithdraw.mediumRisk.amount,
  );
  const highRiskVault = useVaultManager("HighRiskVault", vaultDeposit.highRisk.amount, vaultWithdraw.highRisk.amount);

  // refactor this after adding type to depositState
  type VaultKey = keyof typeof vaultDeposit;
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

  const handleVaultDepositChange = (event: ChangeEvent<HTMLInputElement>, vaultType: string) => {
    const percentage = +event.target.value;
    const amount = (percentage * Number(formatEther(userGoldBalance || 0n))) / 100;

    setVaultDeposit(prevState => ({
      ...prevState,
      [vaultType]: {
        percentage: percentage,
        amount: amount.toString(),
      },
    }));
  };

  const handleVaultWithdrawChange = (event: ChangeEvent<HTMLInputElement>, vaultType: string) => {
    const vault = vaults.find(vault => vault.key === vaultType);
    if (!vault) return;

    const percentage = +event.target.value;
    const amount = (percentage * Number(formatEther(vault.maxWithdraw || 0n))) / 100;

    setVaultWithdraw(prevState => ({
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
                <div className="flex items-center gap-8 flex-wrap">
                  <div>
                    <div className="stats shadow">
                      <div
                        className={`stat w-28 ${Number(vault.minimumROI) > 0 ? "bg-green-500/25" : "bg-red-500/25"} `}
                      >
                        <div className="stat-title text-white">Min ROI</div>
                        <div className="stat-value text-white text-xl">{Number(vault.minimumROI) || 0}%</div>
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
                  <div className="grow">
                    <div className="flex items-center gap-4">
                      <div className="mr-3">{vaultDeposit[vault.key].percentage}%</div>
                      <input
                        type="range"
                        min={0}
                        max="100"
                        value={vaultDeposit[vault.key].percentage}
                        onChange={event => handleVaultDepositChange(event, vault.key)}
                        className="range"
                      />
                      <div className="flex justify-center">
                        <div className="mr-1">{Number(vault.depositAmount).toFixed(2)}</div>GLD
                      </div>
                      <button
                        className="btn btn-accent w-28"
                        disabled={!((userGoldBalance ?? 0) > 0)}
                        onClick={async () => {
                          await vault.approve();
                          await vault.deposit();
                          setVaultDeposit(prevState => ({
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

                <div className="flex items-center gap-8 flex-wrap">
                  <div>
                    <div className="stats shadow">
                      <div className="stat bg-green-500/25 w-28">
                        <div className="stat-title text-white">Max ROI</div>
                        <div className="stat-value text-white text-xl">+{Number(vault.maximumROI) || 0}%</div>
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
                  <div className="grow">
                    <div className="flex items-center gap-4">
                      <div className="mr-3">{vaultWithdraw[vault.key].percentage}%</div>
                      <input
                        type="range"
                        min={0}
                        max="100"
                        value={vaultWithdraw[vault.key].percentage}
                        onChange={event => handleVaultWithdrawChange(event, vault.key)}
                        className="range"
                      />
                      <div className="flex justify-center">
                        <div className="mr-1">{Number(vault.withdrawAmount).toFixed(2)}</div>GLD
                      </div>
                      <button
                        className="btn btn-accent w-28"
                        disabled={!((vault.maxWithdraw ?? 0) > 0)}
                        onClick={async () => {
                          await vault.withdraw();
                          setVaultWithdraw(prevState => ({
                            ...prevState,
                            [vault.key]: {
                              percentage: 0,
                              amount: "0",
                            },
                          }));
                        }}
                      >
                        Withdraw
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};
