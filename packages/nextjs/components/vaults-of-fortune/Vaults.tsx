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
  const [showDeposit, setShowDeposit] = useState(true);

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
          <div
            key={vault.title}
            className={`bg-base-300 p-5 md:p-10 rounded-2xl border ${
              vault.key === "lowRisk"
                ? "border-[#4BC0C0]"
                : vault.key === "mediumRisk"
                ? "border-[#FFCE56]"
                : "border-[#FF6384]"
            } `}
          >
            <div className="flex justify-center items-center mb-5 gap-5 xl:gap-10">
              <div className="rounded-2xl overflow-hidden">
                <Image src="/vault.png" width="200" height="200" alt="cartoon vault" />
              </div>
              <div>
                <h2 className="mb-3 text-4xl font-cubano text-center">{vault.title}</h2>
                <h6 className="text-center text-xl mb-3 ">
                  {Number(vault.minimumROI) || 0} to {Number(vault.maximumROI) || 0}%
                </h6>
              </div>
            </div>
            <div className="">
              <div className="overflow-x-auto mb-5">
                <table className="table text-xl bg-base-200">
                  <thead>
                    <tr className="text-xl text-white border-b border-base-100">
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
                <div className="bg-base-200 p-5 rounded-2xl">
                  <div className="flex bg-base-100 p-1.5 grid grid-cols-2 rounded-xl mb-5">
                    <button
                      onClick={() => setShowDeposit(true)}
                      className={`${showDeposit && "btn"} rounded-lg capitalize text-xl`}
                    >
                      Deposit
                    </button>
                    <button
                      onClick={() => setShowDeposit(false)}
                      className={`${!showDeposit && "btn"} rounded-lg capitalize text-xl`}
                    >
                      Withdraw
                    </button>
                  </div>

                  {showDeposit ? (
                    <>
                      <div className="text-xl text-center mb-3">{Number(vault.depositAmount).toFixed(1)} GLD</div>
                      <div className="flex items-center gap-4 mb-1 px-3 mb-5">
                        <input
                          type="range"
                          min={0}
                          max="100"
                          value={vaultDeposit[vault.key].percentage}
                          onChange={event => handleVaultDepositChange(event, vault.key)}
                          className="range"
                        />
                        <div className="text-xl text-center">{vaultDeposit[vault.key].percentage}%</div>
                      </div>

                      <button
                        className="btn btn-accent w-full text-xl capitalize"
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
                    </>
                  ) : (
                    <>
                      <div className="flex justify-center">
                        <div className="text-xl mb-3">{Number(vault.withdrawAmount).toFixed(1)} GLD</div>
                      </div>
                      <div className="flex items-center gap-4 mb-5 px-2">
                        <div className="text-xl">{vaultWithdraw[vault.key].percentage}%</div>
                        <input
                          type="range"
                          min={0}
                          max="100"
                          value={vaultWithdraw[vault.key].percentage}
                          onChange={event => handleVaultWithdrawChange(event, vault.key)}
                          className="range"
                        />
                      </div>

                      <button
                        className="btn btn-accent w-full"
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
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};
