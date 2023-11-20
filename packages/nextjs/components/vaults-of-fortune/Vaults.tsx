import { ChangeEvent, useState } from "react";
import { formatEther, formatUnits, parseEther } from "viem";
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
    lowRisk: { amount: "0", percentage: 0, showInterface: true },
    mediumRisk: { amount: "0", percentage: 0, showInterface: true },
    highRisk: { amount: "0", percentage: 0, showInterface: true },
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
        showInterface: true,
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

  const toggleVaultInterface = (vaultType: VaultKey) => {
    setVaultDeposit(prevState => ({
      ...prevState,
      [vaultType]: {
        ...prevState[vaultType],
        showInterface: !prevState[vaultType].showInterface,
      },
    }));
  };

  return (
    <>
      {vaults.map(vault => {
        return (
          <div
            key={vault.title}
            style={{
              backgroundColor:
                vault.key === "lowRisk"
                  ? "rgba(75, 192, 192, 0.2)"
                  : vault.key === "mediumRisk"
                  ? "rgba(255, 206, 86, 0.2)"
                  : "rgba(255, 99, 132, 0.2)",
            }}
            className={`bg-base-300 p-5 md:p-10 rounded-2xl border ${
              vault.key === "lowRisk"
                ? "border-[#4BC0C0]"
                : vault.key === "mediumRisk"
                ? "border-[#FFCE56]"
                : "border-[#FF6384]"
            } `}
          >
            <div className="flex justify-between items-center mb-5 gap-5 xl:gap-10">
              <h2 className="mb-3 text-3xl xl:text-4xl font-cubano text-center">{vault.title}</h2>

              <div>
                <h6 className="text-center text-xl mb-3 bg-base-300 py-5 rounded-xl w-40">
                  {Number(vault.minimumROI) || 0}% to {Number(vault.maximumROI) || 0}%
                </h6>
              </div>
            </div>
            <div className="bg-base-300 rounded-2xl">
              <div className="overflow-x-auto p-5">
                <table className="table text-xl">
                  <thead>
                    <tr className="text-xl border-b border-base-100">
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
                <div className="bg-base-300 p-5 rounded-2xl">
                  <div className="flex bg-base-200 p-1.5 grid grid-cols-2 rounded-xl mb-5">
                    <button
                      onClick={() => toggleVaultInterface(vault.key)}
                      className={`${
                        vaultDeposit[vault.key].showInterface && "btn btn-primary"
                      } rounded-lg capitalize text-xl`}
                    >
                      Deposit
                    </button>
                    <button
                      onClick={() => toggleVaultInterface(vault.key)}
                      className={`${
                        !vaultDeposit[vault.key].showInterface && "btn btn-primary"
                      } rounded-lg capitalize text-xl`}
                    >
                      Withdraw
                    </button>
                  </div>

                  {vaultDeposit[vault.key].showInterface ? (
                    <>
                      <div className="text-xl text-center mb-3 bg-base-200 py-3 rounded-xl">
                        {Number(vault.depositAmount).toFixed(1)} GLD
                      </div>
                      <div className="flex items-center gap-4 mb-1 mb-5">
                        <div className="text-xl text-center">{vaultDeposit[vault.key].percentage}%</div>
                        <input
                          type="range"
                          min={0}
                          max="100"
                          value={vaultDeposit[vault.key].percentage}
                          onChange={event => handleVaultDepositChange(event, vault.key)}
                          className="range"
                        />
                      </div>

                      {(vault.userGoldAllowance || 0n) <= parseEther(vault.depositAmount) ? (
                        <button
                          className="btn btn-accent w-full text-xl capitalize"
                          disabled={!((userGoldBalance ?? 0) > 0)}
                          onClick={async () => {
                            await vault.approve();
                          }}
                        >
                          Approve
                        </button>
                      ) : (
                        <button
                          className="btn btn-accent w-full text-xl capitalize"
                          disabled={!((userGoldBalance ?? 0) > 0)}
                          onClick={async () => {
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
                      )}
                    </>
                  ) : (
                    <>
                      <div className="text-xl text-center mb-3 bg-base-200 py-3 rounded-xl">
                        {Number(vault.withdrawAmount).toFixed(1)} GLD
                      </div>

                      <div className="flex items-center gap-4 mb-5">
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
                        className="btn btn-accent w-full capitalize text-xl"
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
