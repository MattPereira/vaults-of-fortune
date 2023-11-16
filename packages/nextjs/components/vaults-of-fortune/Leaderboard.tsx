// import { useEffect, useState } from "react";
import { Address } from "~~/components/scaffold-eth";
import { useFetchTotalGold } from "~~/hooks/";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";

// interface IPlayerData {
//   address: string;
//   totalGold: number;
// }

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
          <thead>
            <tr className="text-xl">
              <th>Pos</th>
              <th>Player</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {players?.map(player => {
              return (
                <tr key={player}>
                  <th> 1</th>
                  <td>
                    <Address size="lg" address={player} />
                  </td>
                  <td>
                    <TotalGoldBalance address={player} />{" "}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function TotalGoldBalance({ address }: { address: string }) {
  const totalGold = useFetchTotalGold(address);
  return <>{totalGold}</>;
}
