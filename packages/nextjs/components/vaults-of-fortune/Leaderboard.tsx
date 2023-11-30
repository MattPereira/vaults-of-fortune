import { useEffect, useState } from "react";
import { formatEther } from "viem";
import { usePublicClient } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import {
  useDeployedContractInfo, // useScaffoldContractRead,
  // useScaffoldEventHistory,
  // useScaffoldEventSubscriber,
} from "~~/hooks/scaffold-eth";

// interface IPlayerScores {
//   contestNumber: number | undefined;
//   roundNumber: number | undefined;
//   player: string | undefined;
//   totalAssets: number;
//   blockNumber: bigint;
// }

interface IPlayersAssets {
  player: string;
  totalAssets: bigint;
}

const maxWithdrawABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "maxWithdraw",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const balanceOfABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const lowAddr = "0xFd22CFe7977ec28909e3f4867dF9962Ce5BFD861";
const mediumAddr = "0xFe3f176aDC15008d3e79181803a689572b8D3730";
const highAddr = "0xbDD01425dC5B72b84730411d344359Bf667BA6AA";
const goldAddr = "0x85D3B09cbA4f5994102435caD33f27f00E7f00CB";
const marketAddr = "0x51f83e8653e198A089c41F61f8De1791140a9d03";

export const Leaderboard = () => {
  const [playersAssets, setPlayersAssets] = useState<IPlayersAssets[]>([]);
  const publicClient = usePublicClient();
  const { data: MarketContract } = useDeployedContractInfo("Market");
  const { data: LowRiskContract } = useDeployedContractInfo("LowRiskVault");
  const { data: MediumRiskContract } = useDeployedContractInfo("MediumRiskVault");
  const { data: HighRiskContract } = useDeployedContractInfo("HighRiskVault");
  const { data: GoldContract } = useDeployedContractInfo("GoldToken");

  useEffect(() => {
    async function getPlayers() {
      const players = await publicClient.readContract({
        address: MarketContract?.address || marketAddr,
        abi: [
          {
            inputs: [],
            name: "getPlayers",
            outputs: [
              {
                internalType: "address[]",
                name: "",
                type: "address[]",
              },
            ],
            stateMutability: "view",
            type: "function",
          },
        ],
        functionName: "getPlayers",
      });

      const scores = players.map(async player => {
        const lowRiskAssets = (await publicClient.readContract({
          address: LowRiskContract?.address || lowAddr,
          abi: maxWithdrawABI,
          functionName: "maxWithdraw",
          args: [player],
        })) as bigint;

        const mediumRiskAssets = (await publicClient.readContract({
          address: MediumRiskContract?.address || mediumAddr,
          abi: maxWithdrawABI,
          functionName: "maxWithdraw",
          args: [player],
        })) as bigint;

        const highRiskAssets = (await publicClient.readContract({
          address: HighRiskContract?.address || highAddr,
          abi: maxWithdrawABI,
          functionName: "maxWithdraw",
          args: [player],
        })) as bigint;

        const goldBalance = (await publicClient.readContract({
          address: GoldContract?.address || goldAddr,
          abi: balanceOfABI,
          functionName: "balanceOf",
          args: [player],
        })) as bigint;

        const totalAssets = lowRiskAssets + mediumRiskAssets + highRiskAssets + goldBalance;

        return { player, totalAssets };
      });

      const playerScores = await Promise.all(scores);

      playerScores.sort((a, b) => {
        if (a.totalAssets < b.totalAssets) {
          return 1;
        }
        if (a.totalAssets > b.totalAssets) {
          return -1;
        }
        return 0;
      });
      setPlayersAssets(playerScores);
      // console.log("playerScores", formatEther(playerScores[0].totalAssets));
    }

    getPlayers();
  }, [publicClient, MarketContract, LowRiskContract, MediumRiskContract, HighRiskContract, GoldContract]);

  console.log("playersAssets", playersAssets);

  ///////////////////////////////////////////////////////////////////////
  // const [playersScores, setPlayersScores] = useState<IPlayerScores[]>([]);

  // const { data: currentContestNumber } = useScaffoldContractRead({
  //   contractName: "Market",
  //   functionName: "getCurrentContestNumber",
  // });

  // const { data: currentRoundNumber } = useScaffoldContractRead({
  //   contractName: "Market",
  //   functionName: "getCurrentRoundNumber",
  // });

  // const { data: events, isLoading: isLoadingEvents } = useScaffoldEventHistory({
  //   contractName: "Market",
  //   eventName: "PlayerTotalAssetUpdate",
  //   fromBlock: 0n,
  //   // Apply filters to the event based on parameter names and values { [parameterName]: value },
  //   filters: {
  //     contestNumber: currentContestNumber,
  //     roundNumber: currentRoundNumber,
  //   },
  // });

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

  // useScaffoldEventSubscriber({
  //   contractName: "Market",
  //   eventName: "PlayerTotalAssetUpdate",

  //   listener: logs => {
  //     logs.forEach(log => {
  //       const { contestNumber, roundNumber, player, totalAssets } = log.args;
  //       const { blockNumber } = log;

  //       setPlayersScores(prevScores => {
  //         // Find index of existing entry for the same player
  //         const existingIndex = prevScores.findIndex(score => score.player === player);

  //         // Prepare the new score entry
  //         const newScore = {
  //           contestNumber: Number(contestNumber),
  //           roundNumber: Number(roundNumber),
  //           player: player,
  //           totalAssets: Number(formatEther(totalAssets || 0n)),
  //           blockNumber: blockNumber,
  //         };

  //         // If the player already exists in the array
  //         if (existingIndex !== -1) {
  //           // Compare block numbers and update only if the new event is more recent
  //           if (prevScores[existingIndex].blockNumber < blockNumber) {
  //             // Replace the existing entry with the new one
  //             const updatedScores = [...prevScores];
  //             updatedScores[existingIndex] = newScore;
  //             updatedScores.sort((a, b) => b.totalAssets - a.totalAssets);
  //             return updatedScores;
  //           } else {
  //             // Keep the array as it is if the existing event is more recent
  //             return prevScores;
  //           }
  //         } else {
  //           // Add the new score if the player is not already in the array
  //           return [...prevScores, newScore].sort((a, b) => b.totalAssets - a.totalAssets);
  //         }
  //       });
  //     });
  //   },
  // });

  // // console.log("playersScores", playersScores);

  // useEffect(() => {
  //   if (!playersScores?.length && !!events?.length && !isLoadingEvents) {
  //     const rawScores: IPlayerScores[] = events.map(event => {
  //       const { args, log } = event;
  //       // console.log("event", event);
  //       return {
  //         contestNumber: Number(args.contestNumber),
  //         roundNumber: Number(args.roundNumber),
  //         player: args.player,
  //         totalAssets: Number(formatEther(args.totalAssets || 0n)),
  //         blockNumber: log.blockNumber,
  //       };
  //     });

  //     const uniquePlayerScores = rawScores.reduce<Record<string, IPlayerScores>>((acc, item) => {
  //       // Check if this player already exists in the accumulator

  //       if (item.player) {
  //         if (!acc[item.player] || acc[item.player].blockNumber < item.blockNumber) {
  //           // If not present, or if the current item's blockNumber is greater, store it
  //           acc[item.player] = item;
  //         }
  //       }

  //       return acc;
  //     }, {});

  //     const playerScores = Object.values(uniquePlayerScores);

  //     const sortedScores = playerScores.sort((a, b) => {
  //       return b.totalAssets - a.totalAssets;
  //     });
  //     setPlayersScores(sortedScores);
  //   }
  // }, [playersScores.length, events, isLoadingEvents]);

  return (
    <div>
      <h3 className="text-center text-3xl xl:text-4xl mb-8 font-cubano">Leaderboard</h3>
      <div className="overflow-x-auto">
        <table className="table text-xl">
          <thead>
            <tr className="text-xl border-b border-white">
              <th>Pos</th>
              <th>Player</th>
              <th>Total Assets</th>
            </tr>
          </thead>
          <tbody>
            {playersAssets.map((score, idx) => {
              return (
                <tr key={score.player} className="border-b border-[#FFFFFF33]">
                  <th>{idx + 1}</th>
                  <td>
                    <Address size="lg" address={score.player} />
                  </td>
                  <td>{Number(formatEther(score.totalAssets)).toFixed(0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
