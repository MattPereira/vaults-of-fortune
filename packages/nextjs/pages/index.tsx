import type { NextPage } from "next";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { MetaHeader } from "~~/components/MetaHeader";
import { Vaults } from "~~/components/Vaults";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const account = useAccount();

  const { data: userGoldBalance } = useScaffoldContractRead({
    contractName: "GoldToken",
    functionName: "balanceOf",
    args: [account.address],
  });

  const {
    writeAsync: enterContest,
    // isLoading,
    // isMining,
  } = useScaffoldContractWrite({
    contractName: "Market",
    functionName: "enterContest",
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

  console.log(lowRiskAllocation, mediumRiskAllocation, highRiskAllocation);

  return (
    <>
      <MetaHeader />
      <div className="bg-base-300 mb-10">
        <h1 className="text-6xl text-center font-cubano my-14">Vaults Of Fortune</h1>

        <div className="rounded-xl grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div>
            <h3 className="text-center text-2xl font-cubano">Leaderboard</h3>
          </div>

          <div>
            <h3 className="text-white text-center font-cubano text-2xl">Your Portfolio</h3>
            <div className="text-center mb-5">
              <div className="text-2xl">{formatEther(userGoldBalance || 0n)} GLD</div>
            </div>
            <div className="flex justify-around">
              <div>
                <div
                  className="radial-progress"
                  style={{ "--value": lowRiskAllocation } as React.CSSProperties}
                  role="progressbar"
                >
                  {lowRiskAllocation} %
                </div>
                <p className="text-center">Low Risk</p>
              </div>

              <div>
                <div
                  className="radial-progress"
                  style={{ "--value": mediumRiskAllocation } as React.CSSProperties}
                  role="progressbar"
                >
                  {mediumRiskAllocation} %
                </div>
                <p className="text-center">Medium Risk</p>
              </div>

              <div>
                <div
                  className="radial-progress"
                  style={{ "--value": highRiskAllocation } as React.CSSProperties}
                  role="progressbar"
                >
                  {highRiskAllocation} %
                </div>
                <p className="text-center">High Risk</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-center text-2xl font-cubano">Round</h3>
            <div className="flex justify-around">
              <div>
                <h5>Number</h5>
              </div>
              <div>
                <h5>State</h5>
              </div>
              <div>
                <h5>Timer</h5>
                <div className="flex justify-center">
                  <span className="countdown font-mono text-6xl ">
                    <span style={{ "--value": 60 } as React.CSSProperties}></span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center my-10">
          <button className="btn bg-yellow-400 text-secondary" onClick={() => enterContest()}>
            Enter Contest
          </button>
        </div>
      </div>

      <div className="px-10">
        <div className="grid grid-cols-1 gap-8">
          <Vaults />
        </div>
      </div>
    </>
  );
};

export default Home;
