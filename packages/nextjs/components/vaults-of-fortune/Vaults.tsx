import { ChangeEvent, useState } from "react";
import Image from "next/image";
import { formatEther, formatUnits } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import { IVaultManager, useVaultManager } from "~~/hooks/useVaultManager";

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
          <div key={vault.title} className="3xl:px-5">
            <h2 className="mb-3 text-3xl font-cubano text-center">{vault.title}</h2>
            <h6 className="text-center text-xl mb-3 ">
              {Number(vault.minimumROI) || 0} to {Number(vault.maximumROI) || 0}%
            </h6>
            <div className="flex justify-center mb-5">
              <div className="rounded-2xl overflow-hidden">
                <Image src="/vault.png" width="300" height="300" alt="cartoon vault" />
              </div>
            </div>
            <div className="">
              <div className="overflow-x-auto mb-7">
                <table className="table text-xl bg-base-100">
                  <thead>
                    <tr className="text-xl text-white">
                      <th></th>
                      <th>Total</th>
                      <th>Yours</th>
                      <th>Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th>Assets</th>
                      <td>{Number(formatUnits(vault.totalAssets || 0n, 18)).toFixed(1)}</td>
                      <td>{Number(formatUnits(vault.maxWithdraw || 0n, 18)).toFixed(1)}</td>
                      <td>GLD</td>
                    </tr>
                    <tr>
                      <th>Supply</th>
                      <td>{Number(formatUnits(vault.totalSupply || 0n, 18)).toFixed(1)}</td>
                      <td>{Number(formatUnits(vault.maxRedeem || 0n, 18)).toFixed(1)}</td>
                      <td>Shares</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                {/* Deposit Interface */}
                <div className="flex items-center mb-5 gap-4">
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

                {/* Withdraw Interface */}

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
        );
      })}
    </>
  );
};
