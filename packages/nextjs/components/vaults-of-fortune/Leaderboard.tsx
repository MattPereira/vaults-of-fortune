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
  blockNumber: bigint;
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
    // Apply filters to the event based on parameter names and values { [parameterName]: value },
    filters: {
      contestNumber: currentContestNumber,
      roundNumber: currentRoundNumber,
    },
  });

  useScaffoldEventSubscriber({
    contractName: "Market",
    eventName: "PlayerTotalAssetUpdate",

    listener: logs => {
      logs.forEach(log => {
        const { contestNumber, roundNumber, player, totalAssets } = log.args;
        const { blockNumber } = log;

        setPlayersScores(prevScores => {
          // Find index of existing entry for the same player
          const existingIndex = prevScores.findIndex(score => score.player === player);

          // Prepare the new score entry
          const newScore = {
            contestNumber: Number(contestNumber),
            roundNumber: Number(roundNumber),
            player: player,
            totalAssets: Number(formatEther(totalAssets || 0n)),
            blockNumber: blockNumber,
          };

          // If the player already exists in the array
          if (existingIndex !== -1) {
            // Compare block numbers and update only if the new event is more recent
            if (prevScores[existingIndex].blockNumber < blockNumber) {
              // Replace the existing entry with the new one
              const updatedScores = [...prevScores];
              updatedScores[existingIndex] = newScore;
              return updatedScores;
            } else {
              // Keep the array as it is if the existing event is more recent
              return prevScores;
            }
          } else {
            // Add the new score if the player is not already in the array
            return [...prevScores, newScore];
          }
        });
      });
    },
  });

  console.log("playersScores", playersScores);

  useEffect(() => {
    if (!playersScores?.length && !!events?.length && !isLoadingEvents) {
      const unsortedScores = events.map(event => {
        const { args, log } = event;
        console.log("event", event);
        return {
          contestNumber: Number(args.contestNumber),
          roundNumber: Number(args.roundNumber),
          player: args.player,
          totalAssets: Number(formatEther(args.totalAssets || 0n)),
          blockNumber: log.blockNumber,
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
      <h3 className="text-center text-3xl xl:text-4xl mb-8 font-cubano">Leaderboard</h3>
      <div className="overflow-x-auto">
        <table className="table text-xl">
          <thead>
            <tr className="text-xl">
              <th>Pos</th>
              <th>Player</th>
              <th>Total Assets</th>
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
                  <td>{score.totalAssets?.toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
