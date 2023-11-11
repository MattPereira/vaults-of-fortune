import type { NextPage } from "next";
import { MetaHeader } from "~~/components/MetaHeader";
import { Portfolio, Vaults } from "~~/components/vaults-of-fortune/";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
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

      <div className="bg-base-300">
        <h1 className="text-6xl text-center font-cubano my-10">Vaults Of Fortune</h1>

        <div className="text-center mb-10">
          <button className="btn bg-yellow-400 text-secondary" onClick={() => enterContest()}>
            Enter Contest
          </button>
        </div>

        <div className="rounded-xl grid grid-cols-1 xl:grid-cols-3 gap-8 mb-10">
          <div>
            <h3 className="text-center text-2xl font-cubano">Leaderboard</h3>
          </div>
          <div>
            <Portfolio />
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
      </div>

      <div className="p-10">
        <div className="grid grid-cols-1 gap-8">
          <Vaults />
        </div>
      </div>
    </>
  );
};

export default Home;
