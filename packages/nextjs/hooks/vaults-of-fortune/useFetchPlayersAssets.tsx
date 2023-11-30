import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";
import {
  //  useDeployedContractInfo,
  useScaffoldContractRead,
} from "~~/hooks/scaffold-eth";

// import { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract";

interface IPlayersAssets {
  player: string;
  totalAssets: bigint;
}

/**
 * @NOTICE hardcoding chainID 80001 for now
 */

export function useFetchPlayersAssets() {
  const [playersAssets, setPlayersAssets] = useState<IPlayersAssets[]>([]);
  const publicClient = usePublicClient();

  console.log("deployedContracts", deployedContracts);

  const { data: players } = useScaffoldContractRead({
    contractName: "Market",
    functionName: "getPlayers",
  });

  useEffect(() => {
    async function getPlayers() {
      // THIS DOES NOT WORK BECAUSE CONTRACTS.CONTRACT_NAME.ABI will be inaccessable through type checker
      // const chainId = await publicClient.getChainId();
      // const contracts = (deployedContracts as GenericContractsDeclaration)[chainId]
      const contracts = deployedContracts[80001];

      console.log("contract AVI", contracts.Market.abi);
      const players = await publicClient.readContract({
        address: contracts.Market.address,
        abi: contracts.Market.abi,
        functionName: "getPlayers",
      });

      const scores = players.map(async player => {
        const lowRiskAssets = (await publicClient.readContract({
          address: contracts.LowRiskVault.address,
          abi: contracts.LowRiskVault.abi,
          functionName: "maxWithdraw",
          args: [player],
        })) as bigint;

        const mediumRiskAssets = (await publicClient.readContract({
          address: contracts.MediumRiskVault.address,
          abi: contracts.MediumRiskVault.abi,
          functionName: "maxWithdraw",
          args: [player],
        })) as bigint;

        const highRiskAssets = (await publicClient.readContract({
          address: contracts.HighRiskVault.address,
          abi: contracts.HighRiskVault.abi,
          functionName: "maxWithdraw",
          args: [player],
        })) as bigint;

        const goldBalance = (await publicClient.readContract({
          address: contracts.GoldToken.address,
          abi: contracts.GoldToken.abi,
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
    }

    getPlayers();
  }, [publicClient, players]);

  return { playersAssets };
}
