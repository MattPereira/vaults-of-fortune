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

  return (
    <>
      <MetaHeader />
      <div className="bg-base-300 mb-10">
        <h1 className="text-6xl text-center font-cubano my-14">Vaults Of Fortune</h1>

        <div className="rounded-xl grid grid-cols-3">
          <div>
            <h3 className="text-center text-2xl font-cubano">Leaderboard</h3>
          </div>

          <div>
            <h5 className="text-accent text-center font-cubano text-4xl mb-10">
              Your Gold Balance: {formatEther(userGoldBalance || 0n)}
            </h5>
          </div>
          <div>
            <h3 className="text-center text-2xl font-cubano">Round Info</h3>
            <p>Time remaining</p>
            <p>open/calculating/closed state</p>
            <p>Round number</p>

            <div className="flex justify-center">
              <span className="countdown font-mono text-6xl">
                <span style={{ "--value": 60 } as React.CSSProperties}></span>
              </span>
            </div>
          </div>
        </div>

        <div className="text-center my-10">
          <button className="btn btn-warning" onClick={() => enterContest()}>
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
