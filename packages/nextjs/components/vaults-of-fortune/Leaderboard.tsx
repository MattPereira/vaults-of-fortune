import { formatEther } from "viem";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";

export const Leaderboard = () => {
  const { data: players } = useScaffoldContractRead({
    contractName: "Market",
    functionName: "getPlayers",
  });

  return (
    <div>
      <h3 className="text-center text-3xl mb-5 font-cubano">Leaderboard</h3>
      <div className="overflow-x-auto">
        <table className="table text-xl">
          {/* head */}
          <thead>
            <tr className="text-xl">
              <th>Pos</th>
              <th>Player</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {players?.map((address, idx) => (
              <tr key={address}>
                <th>{idx + 1}</th>
                <td>
                  <Address size="lg" address={address} />
                </td>
                <td>
                  <TotalGold address={address} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface ITotalGold {
  address: string;
}

const TotalGold: React.FC<ITotalGold> = ({ address }) => {
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
  return <>{formattedTotal}</>;
};
