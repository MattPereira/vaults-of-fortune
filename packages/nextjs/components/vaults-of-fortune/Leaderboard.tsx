// import { useFetchPlayersAssets } from "~~/hooks/vaults-of-fortune";
import { useEffect, useState } from "react";
import { formatEther } from "viem";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldContractRead, useScaffoldEventHistory, useScaffoldEventSubscriber } from "~~/hooks/scaffold-eth";

interface IPlayerScores {
  contestNumber: number | undefined;
  roundNumber: number | undefined;
  player: string | undefined;
  totalAssets: number;
  blockNumber: bigint;
}

export const Leaderboard = () => {
  // const { playersAssets } = useFetchPlayersAssets();

  const [playersScores, setPlayersScores] = useState<IPlayerScores[]>([]);

  console.log("playersScores", playersScores);

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
    // fromBlock: 0n,
    fromBlock: 43030910n,
    // Apply filters to the event based on parameter names and values { [parameterName]: value },
    filters: {
      contestNumber: currentContestNumber,
      roundNumber: currentRoundNumber,
    },
  });

  // useScaffoldEventSubscriber({
  //   contractName: "Market",
  //   eventName: "ContestOpened",

  //   listener: logs => {
  //     logs.forEach(log => {
  //       console.log("ContestOpened", log);
  //       setPlayersScores([]);
  //     });
  //   },
  // });

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
              updatedScores.sort((a, b) => b.totalAssets - a.totalAssets);
              return updatedScores;
            } else {
              // Keep the array as it is if the existing event is more recent
              return prevScores;
            }
          } else {
            // Add the new score if the player is not already in the array
            return [...prevScores, newScore].sort((a, b) => b.totalAssets - a.totalAssets);
          }
        });
      });
    },
  });

  // console.log("playersScores", playersScores);

  useEffect(() => {
    if (!playersScores?.length && !!events?.length && !isLoadingEvents) {
      const rawScores: IPlayerScores[] = events.map(event => {
        const { args, log } = event;
        // console.log("event", event);
        return {
          contestNumber: Number(args.contestNumber),
          roundNumber: Number(args.roundNumber),
          player: args.player,
          totalAssets: Number(formatEther(args.totalAssets || 0n)),
          blockNumber: log.blockNumber,
        };
      });

      const uniquePlayerScores = rawScores.reduce<Record<string, IPlayerScores>>((acc, item) => {
        // Check if this player already exists in the accumulator

        if (item.player) {
          if (!acc[item.player] || acc[item.player].blockNumber < item.blockNumber) {
            // If not present, or if the current item's blockNumber is greater, store it
            acc[item.player] = item;
          }
        }

        return acc;
      }, {});

      const playerScores = Object.values(uniquePlayerScores);

      const sortedScores = playerScores.sort((a, b) => {
        return b.totalAssets - a.totalAssets;
      });
      setPlayersScores(sortedScores);
    }
  }, [playersScores.length, events, isLoadingEvents]);

  return (
    <div>
      <h3 className="text-center text-3xl xl:text-4xl mb-8 font-cubano">Leaderboard</h3>
      <div className="overflow-x-auto overflow-y-auto h-[325px]">
        <table className="table text-xl">
          <thead>
            <tr className="text-xl border-b border-white">
              <th>Pos</th>
              <th>Player</th>
              <th>Total Godl</th>
            </tr>
          </thead>
          <tbody>
            {playersScores.map((score, idx) => {
              return (
                <tr key={score.player} className="border-b border-[#FFFFFF33]">
                  <th>{idx + 1}</th>
                  <td>
                    <Address size="lg" address={score.player} />
                  </td>
                  <td>{score.totalAssets.toFixed(0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
