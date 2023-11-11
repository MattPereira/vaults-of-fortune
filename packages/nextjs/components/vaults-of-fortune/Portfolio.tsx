import { ArcElement, Chart as ChartJS, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";

ChartJS.register(ArcElement, Tooltip);

export const Portfolio = () => {
  const account = useAccount();

  const { data: goldBalance } = useScaffoldContractRead({
    contractName: "GoldToken",
    functionName: "balanceOf",
    args: [account.address],
  });

  const formattedGoldBalance = +formatEther(goldBalance || 0n);

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

  const formattedLowRisk = +formatEther(lowRiskAssets || 0n);
  const formattedMediumRisk = +formatEther(mediumRiskAssets || 0n);
  const formattedHighRisk = +formatEther(highRiskAssets || 0n);

  const totalAssets = formattedLowRisk + formattedMediumRisk + formattedHighRisk;

  let lowRiskAllocation = 0;
  let mediumRiskAllocation = 0;
  let highRiskAllocation = 0;

  if (totalAssets > 0) {
    lowRiskAllocation = Math.round((formattedLowRisk / totalAssets) * 100);
    mediumRiskAllocation = Math.round((formattedMediumRisk / totalAssets) * 100);
    highRiskAllocation = Math.round((formattedHighRisk / totalAssets) * 100);
  }

  const data = {
    labels: ["Low Risk", "Medium Risk", "High Risk"],
    datasets: [
      {
        label: "%",
        data: [lowRiskAllocation, mediumRiskAllocation, highRiskAllocation],
        backgroundColor: ["rgba(75, 192, 192, 0.2)", "rgba(255, 206, 86, 0.2)", "rgba(255, 99, 132, 0.2)"],
        borderColor: ["rgba(75, 192, 192, 1)", "rgba(255, 206, 86, 1)", "rgba(255, 99, 132, 1)"],
        borderWidth: 1,
      },
    ],
  };

  return (
    <>
      <h3 className="text-white text-center font-cubano text-2xl">Your Portfolio</h3>

      <div className="flex justify-center my-5">
        <div className="w-[350px] h-[350px]">
          <Doughnut data={data} />
        </div>
      </div>

      <div className="text-center">
        <div className="text-2xl">{totalAssets + formattedGoldBalance} GLD</div>
      </div>
    </>
  );
};
