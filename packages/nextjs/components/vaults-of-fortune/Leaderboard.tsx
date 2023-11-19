// import { useEffect, useState } from "react";
import { useEffect, useState } from "react";
import { formatEther } from "viem";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldContractRead, useScaffoldEventHistory, useScaffoldEventSubscriber } from "~~/hooks/scaffold-eth";

interface IPlayerScores {
  contestNumber: number | undefined;
  roundNumber: number | undefined;
  player: string | undefined;
  totalAssets: number | undefined;
}

export const Leaderboard = () => {
  const [playersScores, setPlayersScores] = useState<IPlayerScores[]>([]);

  const { data: currentContestNumber } = useScaffoldContractRead({
    contractName: "Market",
    functionName: "getCurrentContestNumber",
  });

  const { data: currentRoundNumber } = useScaffoldContractRead({
    contractName: "Market",
    functionName: "getCurrentRoundNumber",
  });

  const { data: events, isLoading: isLoadingEvents } = useScaffoldEventHistory({
    contractName: "Market",
    eventName: "PlayerTotalAssetUpdate",
    fromBlock: 0n,
    blockData: true,
    // Apply filters to the event based on parameter names and values { [parameterName]: value },
    filters: { contestNumber: currentContestNumber, roundNumber: currentRoundNumber },
    transactionData: true,
    receiptData: true,
  });

  useScaffoldEventSubscriber({
    contractName: "Market",
    eventName: "PlayerTotalAssetUpdate",

    listener: logs => {
      logs.map(log => {
        // const { contestNumber, roundNumber, player, totalAssets } = log.args;
        console.log("PlayerTotalAssetUpdate", log.args);
      });
    },
  });

  useEffect(() => {
    if (!playersScores?.length && !!events?.length && !isLoadingEvents) {
      const unsortedScores = events.map(({ args }) => {
        return {
          contestNumber: Number(args.contestNumber),
          roundNumber: Number(args.roundNumber),
          player: args.player,
          totalAssets: Number(formatEther(args.totalAssets || 0n)),
        };
      });

      const sortedScores = unsortedScores.sort((a, b) => {
        return b.totalAssets - a.totalAssets;
      });
      setPlayersScores(sortedScores);
    }
  }, [playersScores.length, events, isLoadingEvents]);

  return (
    <div>
      <h3 className="text-center text-3xl xl:text-4xl mb-5 font-cubano">Leaderboard</h3>
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
            {playersScores.map((score, idx) => {
              return (
                <tr key={score.player}>
                  <th>{idx + 1}</th>
                  <td>
                    <Address size="lg" address={score.player} />
                  </td>
                  <td>{score.totalAssets}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
