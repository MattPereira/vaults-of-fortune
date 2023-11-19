import { useEffect, useState } from "react";
import { ArcElement, Chart as ChartJS, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

ChartJS.register(ArcElement, Tooltip);

// const roundState = {
//   0: "Open",
//   1: "Closing",
//   2: "Calculating",
//   3: "Closed",
// };

export const Portfolio = () => {
  const [isPlayer, setIsPlayer] = useState(false);
  const account = useAccount();

  const { data: players } = useScaffoldContractRead({
    contractName: "Market",
    functionName: "getPlayers",
  });

  useEffect(() => {
    if (players !== undefined && account.address !== undefined) {
      setIsPlayer(players.includes(account.address));
    }
  }, [players, account.address]);

  const {
    writeAsync: enterContest,
    // isLoading,
    // isMining,
  } = useScaffoldContractWrite({
    contractName: "Market",
    functionName: "enterContest",
  });

  const {
    writeAsync: startCountdown,
    // isLoading,
    // isMining,
  } = useScaffoldContractWrite({
    contractName: "Market",
    functionName: "startCountdown",
  });

  const { data: userGoldBalance } = useScaffoldContractRead({
    contractName: "GoldToken",
    functionName: "balanceOf",
    args: [account.address],
  });

  const { data: lowRiskAssets } = useScaffoldContractRead({
    contractName: "LowRiskVault",
    functionName: "maxWithdraw",
    args: [account.address],
  });

  const { data: mediumRiskAssets } = useScaffoldContractRead({
    contractName: "MediumRiskVault",
    functionName: "maxWithdraw",
    args: [account.address],
  });

  const { data: highRiskAssets } = useScaffoldContractRead({
    contractName: "HighRiskVault",
    functionName: "maxWithdraw",
    args: [account.address],
  });

  const { data: currentRoundState } = useScaffoldContractRead({
    contractName: "Market",
    functionName: "getCurrentRoundState",
  });

  console.log("currentRoundState", currentRoundState);

  const formattedLowRisk = +formatEther(lowRiskAssets || 0n);
  const formattedMediumRisk = +formatEther(mediumRiskAssets || 0n);
  const formattedHighRisk = +formatEther(highRiskAssets || 0n);
  const formattedGoldBalance = +formatEther(userGoldBalance || 0n);

  const totalAssets = formattedLowRisk + formattedMediumRisk + formattedHighRisk + formattedGoldBalance;

  let lowRiskAllocation = 0;
  let mediumRiskAllocation = 0;
  let highRiskAllocation = 0;
  let goldReservesAllocation = 0;

  if (totalAssets > 0) {
    lowRiskAllocation = Math.round((formattedLowRisk / totalAssets) * 100);
    mediumRiskAllocation = Math.round((formattedMediumRisk / totalAssets) * 100);
    highRiskAllocation = Math.round((formattedHighRisk / totalAssets) * 100);
    goldReservesAllocation = Math.round((formattedGoldBalance / totalAssets) * 100);
  }

  const data = {
    labels: ["Low Risk", "Medium Risk", "High Risk", "Gold Reserves"],
    datasets: [
      {
        label: "%",
        data: [lowRiskAllocation, mediumRiskAllocation, highRiskAllocation, goldReservesAllocation],
        backgroundColor: [
          "rgba(75, 192, 192, 0.2)",
          "rgba(255, 206, 86, 0.2)",
          "rgba(255, 99, 132, 0.2)",
          "rgba(153, 102, 255, 0.2)",
        ],
        borderColor: [
          "rgba(75, 192, 192, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(255, 99, 132, 1)",
          "rgba(153, 102, 255, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <>
      {isPlayer ? (
        <>
          <h3 className="text-white text-center font-cubano text-3xl xl:text-4xl mb-5">Portfolio</h3>

          <div className="flex justify-center">
            <div className="w-[300px] h-[300px] relative">
              <Doughnut data={data} />
              {currentRoundState === 0 && userGoldBalance === 0n && (
                <button
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 10,
                  }}
                  className="btn btn-accent px-5 h-24 w-24 text-xl capitalize"
                  onClick={() => startCountdown()}
                >
                  Ready
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center">
          <h3 className="text-white text-center font-cubano text-3xl mb-10">Contest Rules</h3>

          <p className="text-xl mb-10">
            Contestants are airdropped 10,000 GLD tokens to compete for the highest return on investment over 3 rounds.
            During the round, allocate your tokens to each vault as you please. At the end of each round, the market
            contract will send/take gold to/from the vaults based on the random numbers generated by VRF. Highest net
            worth at the end of the 3rd round wins!
          </p>

          <button className="btn bg-yellow-400 hover:bg-yellow-500 text-primary px-5" onClick={() => enterContest()}>
            Enter Contest
          </button>
        </div>
      )}
    </>
  );
};
